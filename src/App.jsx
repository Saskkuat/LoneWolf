import "./app.css";
import { useState, useEffect } from "react";
import { Play, Pause, StopCircle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

export default function LoneWolfPWA() {
  const [currentBook, setCurrentBook] = useState(() => {
    return parseInt(localStorage.getItem("currentBook")) || null;
  });
  const [currentSection, setCurrentSection] = useState(() => {
    return parseInt(localStorage.getItem("currentSection")) || null;
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("language") || "br";
  });
  const [visitedSections, setVisitedSections] = useState(() => {
    return JSON.parse(localStorage.getItem("visitedSections")) || [];
  });
  const [content, setContent] = useState("");
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(currentSection !== null);
  const [imageFiles, setImageFiles] = useState([]);
  const [loadedImages, setLoadedImages] = useState({});
  const [audioProgress, setAudioProgress] = useState(0); // Progress bar state
  const [audioDuration, setAudioDuration] = useState(0); // Audio duration state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [sectionContents, setSectionContents] = useState({});
  const [isCombatSection, setIsCombatSection] = useState(false);
  const [expandedCombatRatio, setExpandedCombatRatio] = useState(false);
  const [isDeadEnd, setIsDeadEnd] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [isDiceSection, setIsDiceSection] = useState(false);

  useEffect(() => {
    setCurrentBook("FlightFromTheDark")
    if (currentSection === null) return;
    
    localStorage.setItem("currentSection", currentSection);

    if (!visitedSections.includes(currentSection)) {
      const updatedSections = [...visitedSections, currentSection];
      setVisitedSections(updatedSections);
      localStorage.setItem("visitedSections", JSON.stringify(updatedSections));
    }

    fetchContent(currentSection);

    stopAudio();

    const newAudio = new Audio(`/${currentBook}/audio/${language}/${currentSection}.mp3`);
    setAudio(newAudio);
    setIsPlaying(false);

    newAudio.play()
      .then(() => setIsPlaying(true))
      .catch((err) => console.log("Error playing audio:", err));

    newAudio.addEventListener("ended", () => {
      setIsPlaying(false); // Change to play button when audio ends
    });

    newAudio.addEventListener("timeupdate", () => {
      setAudioProgress((newAudio.currentTime / newAudio.duration) * 100); // Update progress bar
    });

    newAudio.addEventListener("loadedmetadata", () => {
      setAudioDuration(newAudio.duration); // Get audio duration
    });

    const fetchImages = async () => {
      const images = [];
      let index = 1;
    
      while (images.length == 0) {
        const imagePath = `/${currentBook}/images/${currentSection}_${index}.gif`;
        try {
          const response = await fetch(imagePath, { method: "HEAD" });
          if (!response.ok) break; // Stop checking if an image is not found
          if(images.indexOf(imagePath) === -1) {
            images.push(imagePath);
            index++;
          }
        } catch {
          break;
        }
      }

      // Only update state if images have changed
      setImageFiles((prevImages) => {
        const newImageSet = new Set(images);
        const prevImageSet = new Set(prevImages);

        // Compare sets to avoid redundant updates
        if (newImageSet.size !== prevImageSet.size || ![...newImageSet].every(img => prevImageSet.has(img))) {
          return images;
        }
        return prevImages; // No update if identical
      });
    };

    fetchImages();

  }, [currentSection, language]);

  const startAdventure = (event, section) => {
    
    setVisitedSections([]);
    localStorage.setItem("visitedSections", JSON.stringify([]));

    setHasStarted(true);
    setCurrentSection(section || 0);
  };

  const fetchContent = async (section, removeChoices) => {

    const setModalContent = removeChoices;
    setIsCombatSection(false);
    setIsDeadEnd(false);
    setIsDiceSection(false);
    setResult(null);

    fetch(`/${currentBook}/text/${language}/${section}.html`)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const decoder = new TextDecoder(language === "br" ? "windows-1252" : "utf-8");
        let decodedContent = decoder.decode(buffer);
        let newIsDiceSection = false;
        
        // Modify the first paragraph
        const parser = new DOMParser();
        const doc = parser.parseFromString(decodedContent, "text/html");
        // Replace external <a> elements
        doc.querySelectorAll(`a${removeChoices ? '' : ':not(.choice a)'}`).forEach((a) => {
          if (a.getAttribute("href").indexOf("random") !== -1) {
            newIsDiceSection = true;
          }
          const span = document.createElement("span");
          span.className = "external";
          span.innerHTML = a.innerHTML;
          a.replaceWith(span);
        });
        if (setModalContent) {
          // Extract only text content (no audio/images)
          setSectionContents((prev) => ({
            ...prev,
            [section]: doc.body.innerHTML,
          }));
        } else {
          if (doc.querySelector('.combat')) {
            setIsCombatSection(true);
            setIsDiceSection(true);
          }
          if (doc.querySelector('.deadend')) {
            setIsDeadEnd(true);
          }
          if (doc.querySelector('span.external')) {
            setIsDiceSection(newIsDiceSection);
          }
          setContent(doc.body.innerHTML);
        }
      })
      .catch(() => {
        if (setModalContent) {
          // Extract only text content (no audio/images)
          setSectionContents((prev) => ({
            ...prev,
            [section]: "<p>Failed to load content.</p>",
          }));
        } else {          
          setContent("<p>Failed to load content.</p>");
        }
      });
  }

  const toggleSection = async (section) => {
    if (expandedSection === section) {
      setExpandedSection(null); // Collapse if the same section is clicked
    } else {
      if (!sectionContents[section]) {
        fetchContent(section, true);
      }
      setExpandedSection(section); // Expand new section
    }
  };

  const toggleCombatRatio = () => {
    setExpandedCombatRatio(!expandedCombatRatio);
  };

  const resetSection = () => {    
    localStorage.removeItem("currentSection");
    stopAudio();
    setCurrentSection(null);
    setHasStarted(false);
  };

  const changeLanguage = () => {
    const newLanguage = language === "br" ? "en" : "br";
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    stopAudio();
  };

  const togglePlayPause = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stopAudio = () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const restartAudio = () => {
    if (audio) {
      audio.currentTime = 0;
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleProgressBarClick = (event) => {
    if (!audio) return;
    const clickPosition = (event.clientX - event.target.offsetLeft) / event.target.offsetWidth;
    audio.currentTime = clickPosition * audio.duration;
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    } else {
      return `${m}:${String(s).padStart(2, "0")}`;
    }
  };

  const handleChoiceClick = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const newSection = parseInt(event.target.getAttribute("href").replace("sect", "").replace(".htm", ""));
    const chapterSelection = event.target.parentElement.classList.contains('chapter');
    stopAudio();
    if (chapterSelection) {
      startAdventure(event, newSection)
    } else {
      setCurrentSection(newSection);
    }
  };

  const handleImageLoad = (src) => {
    setLoadedImages((prev) => ({ ...prev, [src]: true }));
  };

  const handleImageError = (src) => {
    setLoadedImages((prev) => ({ ...prev, [src]: false }));
  };

  const rollDice = () => {
    if (rolling) return; // Prevent multiple rolls

    setRolling(true);
    
    // Simulate rolling time
    setTimeout(() => {
      let newRoll = Math.floor(Math.random() * 10) + 1; // Generate 1-10
      if (newRoll === 10) {
        newRoll = 0;
      }
      setResult(newRoll);
      setRolling(false);
    }, 1500); // Duration matches CSS animation
  };

  useEffect(() => {
    const contentContainer = document.querySelector(".text-content");
    if (!contentContainer) return;
    
    contentContainer.addEventListener("click", (event) => {
      if (event.target.matches(".choice a")) {
        handleChoiceClick(event);
      }
    });
    
    return () => {
      contentContainer.removeEventListener("click", handleChoiceClick);
    };
  }, [content, currentSection]);

  return (
    <div className="app-container flex flex-col items-center justify-center min-h-screen px-6">
      {!hasStarted && (
        <div className="start-container">
          <button className="start-button absolute left-4 top-4 vintage-button" onClick={changeLanguage}>{language.toUpperCase()}</button>
          <br/>
          <br/>
          <button onClick={startAdventure} className="start-button vintage-button">{language === "br" ? "Iniciar uma nova aventura" : "Start a new adventure"}</button>
          <div className="table-chapters">
            <div className="text-content">
              <br/>
              {language == "br" ? "Ou selecione um capítulo abaixo" : "Or select a chapter below"}
              <ul>
                {[...Array(351).keys()]
                  .filter((section) => section !== 0) // Exclude section 0
                  .map((section) => (
                    <li>
                      <p key={section} className="choice chapter"><a href={"sect" + section + ".html"}>{section}</a></p>
                    </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {hasStarted && currentSection !== null && (
        <div>
          <div className="vintage-buttons end">
            <button onClick={() => setIsModalOpen(true)} className="ml-4 p-2 bg-red-500 vintage-button left">{language === "br" ? "Relembre sua jornada" : "Remember your journey"}</button>
            <button onClick={resetSection} className="ml-4 p-2 bg-red-500 vintage-button">{language === "br" ? "Reiniciar aventura" : "Restart adventure"}</button>
            <button className="language-button absolute left-4 top-4 vintage-button" onClick={changeLanguage}>{language.toUpperCase()}</button>
            {isModalOpen && (
              <div className="modal-overlay" onClick={() => {
                  setIsModalOpen(false);
                  setExpandedSection(null);
                }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>{language === "br" ? "Sua jornada" : "Your journey"}</h2>
                  <ul>
                    {visitedSections.slice().reverse().map((section) => (
                      <li key={section}>
                        <button
                          onClick={() => toggleSection(section)}
                          className="section-toggle"
                        >
                          {language === "br" ? "Capítulo" : "Chapter"} {section} {expandedSection === section ? <ChevronUp /> : <ChevronDown />}
                        </button>
                        {expandedSection === section && (
                          <div
                            className="section-content"
                            dangerouslySetInnerHTML={{ __html: sectionContents[section] || "Loading..." }}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => setIsModalOpen(false)} className="close-button">{language === "br" ? "Fechar" : "Close"}</button>
                </div>
              </div>
            )}
          </div>
          <div className="vintage-frame">
            <div className="vintage-buttons">
              {currentSection != 0 && (
                <div className="stored-section-display my-4 text-lg font-bold">
                  <span className="first"><span className="firstLetter">{currentSection}</span></span>
                </div>
              )}
              {/* Vintage Audio Player */}
              <div className="vintage-audio-player">
                <div className="audio-controls">
                  <button onClick={togglePlayPause} className="vintage-button">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                  <button onClick={stopAudio} className="vintage-button">
                    <StopCircle className="w-5 h-5" />
                  </button>
                  <button onClick={restartAudio} className="vintage-button">
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                {/* Audio Progress Bar */}
                <div 
                  className="audio-progress-bar"
                  onClick={handleProgressBarClick}
                >
                  <div
                    className="audio-progress"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>

                {/* Time display */}
                <div className="audio-time">
                  <span>{formatTime(Math.floor(audioProgress / 100 * audioDuration))} / {formatTime(Math.floor(audioDuration))}</span>
                </div>
              </div>
            </div>
            <div className="content-container mx-auto my-8 p-8 border border-[#d4c2a0] bg-[#fdf8e1] text-[#3e2723] font-serif leading-relaxed text-justify shadow-lg rounded-lg">            
              {currentSection == 0 && (
                <div className="intro-content">
                  <p className="first intro">
                      <span className="firstLetter">{language == "br" ? "O" : "T"}</span>
                      <span className="intro">{language == "br" ? " caminho até aqui..." : "he story so far…"}</span>
                  </p>
                </div>
              )}
              <div className="text-content" dangerouslySetInnerHTML={{ __html: content }} />
              {imageFiles.length > 0 && (
                  imageFiles.map((src, index) => (
                    loadedImages[src] !== false && (
                      <div className="section-images mt-4 flex flex-col items-center gap-4">
                      <img 
                        key={index}
                        src={src} 
                        alt={`Section Illustration ${index + 1}`} 
                        className="max-w-full h-auto rounded-lg shadow" 
                        onLoad={() => handleImageLoad(src)}
                        onError={() => handleImageError(src)}
                      />                    
                    </div>
                    )
                  ))
              )}
            </div>
            {isDiceSection && (
              <div className="dice-container">
                <div className={`dice ${rolling ? "rolling" : ""}`} onClick={rollDice}>
                  {rolling ? "🎲" : result ?? "🎲"}
                </div>
              </div>
            )}
            {isCombatSection && (
              <div>
                <button
                  onClick={() => toggleCombatRatio()}
                  className="vintage-button"
                >
                  {language === "br" ? "Tabela de combate" : "Combat table"}
                </button>
                {expandedCombatRatio && (
                  <div className="combat-ratio-tables">
                    <img alt="Combat ratio table - negative" class="max-w-full h-auto rounded-lg shadow" src="images/crtneg.png"></img>
                    <img alt="Combat ratio table - positive" class="max-w-full h-auto rounded-lg shadow" src="images/crtpos.png"></img>
                  </div>
                )}
              </div>
            )}
            {isDeadEnd && (
              <div>
                <img src="images/blood.svg" alt="Blood" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import "./app.css";
import booksData from './books.json';
import { useState, useEffect } from "react";
import { Play, Pause, StopCircle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

export default function LoneWolfPWA() {
  const validBooks = booksData;
  const [currentBook, setCurrentBook] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("currentBook")) || null;
    } catch (error) {
      return null; // Fallback in case of corrupted storage
    }
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
  const [hasStarted, setHasStarted] = useState(currentSection);
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

  const setCurrentBookInfo = (bookId) => {
    const book = validBooks.find(e => e.id === bookId);
    if (book) {    
      localStorage.setItem("currentBook", JSON.stringify(book));
    }
    else {
      localStorage.setItem("currentBook", null);
    }
    setCurrentBook(book);
  }

  const clearSections = () => {    
    setVisitedSections([]);
    localStorage.setItem("visitedSections", JSON.stringify([]));
  }

  const changeSelectedBook = (event) => {
    clearSections();
    setCurrentBook(null);
    localStorage.removeItem("currentBook"); // <-- Ensure localStorage is cleared
  }

  const startAdventure = (event, section) => {
    clearSections();
    setHasStarted(true);
    setCurrentSection(section || 0);
  };

  const changeLanguage = () => {
    const newLanguage = language === "br" ? "en" : "br";
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    stopAudio();
  };

  const resetSection = () => {    
    localStorage.removeItem("currentSection");
    stopAudio();
    setCurrentSection(null);
    setHasStarted(false);
  };

  useEffect(() => {

    if (!currentBook) return;
    
    localStorage.setItem("currentBook", JSON.stringify(currentBook));

    if (currentSection === null) return;
    
    localStorage.setItem("currentSection", currentSection);

    if (!visitedSections.includes(currentSection)) {
      const updatedSections = [...visitedSections, currentSection];
      setVisitedSections(updatedSections);
      localStorage.setItem("visitedSections", JSON.stringify(updatedSections));
    }
    fetchContent(currentSection);
    fetchAudio(currentSection);

  }, [currentBook, currentSection, language]);

  const fetchContent = async (section, removeChoices) => {

    const setModalContent = removeChoices;
    setIsCombatSection(false);
    setIsDeadEnd(false);
    setIsDiceSection(false);
    setResult(null);    
    setExpandedCombatRatio(false);

    fetch(`./${currentBook.path}/text/${language}/${section}.html`)
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
        doc.querySelectorAll("figure img").forEach((i) => {
          const src = i.getAttribute("src").replace("png", "gif");
          i.setAttribute("src", `./${currentBook.path}/images/${src}`);
        });
        // Condition to set content for modal or main page
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

  const fetchAudio = async (section) => {

    stopAudio();

    const newAudio = new Audio(`./${currentBook.path}/audio/${language}/${section}.mp3`);
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
  }

  const toggleCombatRatio = () => {
    setExpandedCombatRatio(!expandedCombatRatio);
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

  const stopDefaultHandler = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    stopAudio();
  }

  const handleBookClick = (bookSelector) => {
    const bookId = parseInt(bookSelector.dataset["bookId"]);
    setCurrentBookInfo(bookId);
  }

  const handleChapterClick = (event) => {
    const newSection = parseInt(event.target.getAttribute("href").replace("chapter", "").replace(".html", ""));
    startAdventure(event, newSection);
  }

  const handleChoiceClick = (event) => {
    const newSection = parseInt(event.target.getAttribute("href").replace("sect", "").replace(".htm", ""));
    setCurrentSection(newSection);
  };

  // Set handlers
  useEffect(() => {
    const contentContainer = document.querySelector(".text-content");
    if (!contentContainer) return;
    
    contentContainer.addEventListener("click", (event) => {

      if (event.target.matches(".choice a")) {
        stopDefaultHandler(event);
      }

      const bookSelector = event.target.closest('.content.choice.book');

      if (bookSelector) {
        handleBookClick(bookSelector);
      }
      else if (event.target.matches(".choice.chapter a")) {
        handleChapterClick(event);
      }
      else if (event.target.matches(".choice:not(.book):not(.chapter) a")) {
        handleChoiceClick(event);
      }
    });
    
    return () => {
      contentContainer.removeEventListener("click", handleChoiceClick);
    };
  }, [currentBook, content, currentSection]);

  useEffect(() => {
    if (!validBooks || validBooks.length == 0) return;
    if (currentBook) return;

    var slider = document.getElementById("slider"),
        sliderItems = document.getElementById("items"),
        prev = document.getElementById("prev"),
        next = document.getElementById("next");

    slide(slider, sliderItems, prev, next);

    function slide(wrapper, items, prev, next) {
      var posX1 = 0,
        posX2 = 0,
        posInitial,
        posFinal,
        threshold = 100,
        slides = items.getElementsByClassName("slide"),
        slidesLength = slides.length,
        slideSize = items.getElementsByClassName("slide")[0].offsetWidth,
        firstSlide = slides[0],
        lastSlide = slides[slidesLength - 1],
        cloneFirst = firstSlide.cloneNode(true),
        cloneLast = lastSlide.cloneNode(true),
        index = 0,
        allowShift = true;

      // Clone first and last slide
      items.appendChild(cloneFirst);
      items.insertBefore(cloneLast, firstSlide);
      wrapper.classList.add("loaded");

      // Mouse and Touch events
      //items.onmousedown = dragStart;

      // Touch events
      // items.addEventListener("touchstart", dragStart);
      // items.addEventListener("touchend", dragEnd);
      // items.addEventListener("touchmove", dragAction);

      // Click events
      prev.addEventListener("click", function () {
        shiftSlide(-1);
      });
      next.addEventListener("click", function () {
        shiftSlide(1);
      });

      // Transition events
      items.addEventListener("transitionend", checkIndex);

      function dragStart(e) {
        e = e || window.event;
        e.preventDefault();
        posInitial = items.offsetLeft;

        if (e.type == "touchstart") {
          posX1 = e.touches[0].clientX;
        } else {
          posX1 = e.clientX;
          document.onmouseup = dragEnd;
          document.onmousemove = dragAction;
        }
      }

      function dragAction(e) {
        e = e || window.event;

        if (e.type == "touchmove") {
          posX2 = posX1 - e.touches[0].clientX;
          posX1 = e.touches[0].clientX;
        } else {
          posX2 = posX1 - e.clientX;
          posX1 = e.clientX;
        }
        items.style.left = items.offsetLeft - posX2 + "px";
      }

      function dragEnd(e) {
        posFinal = items.offsetLeft;
        if (posFinal - posInitial < -threshold) {
          shiftSlide(1, "drag");
        } else if (posFinal - posInitial > threshold) {
          shiftSlide(-1, "drag");
        } else {
          items.style.left = posInitial + "px";
        }

        document.onmouseup = null;
        document.onmousemove = null;
      }

      function shiftSlide(dir, action) {
        items.classList.add("shifting");

        if (allowShift) {
          if (!action) {
            posInitial = items.offsetLeft;
          }

          if (dir == 1) {
            items.style.left = posInitial - slideSize + "px";
            index++;
          } else if (dir == -1) {
            items.style.left = posInitial + slideSize + "px";
            index--;
          }
        }

        allowShift = false;
      }

      function checkIndex() {
        items.classList.remove("shifting");

        if (index == -1) {
          items.style.left = -(slidesLength * slideSize) + "px";
          index = slidesLength - 1;
        }

        if (index == slidesLength) {
          items.style.left = -(1 * slideSize) + "px";
          index = 0;
        }

        allowShift = true;
      }
    }
  },[validBooks, currentBook]);

  return (
    <div className={`app-container flex flex-col items-center justify-center min-h-screen px-6 ${!currentBook ? "carousell" : ""}`}>
      {!currentBook && (
        <div className="book-container">
          <button className="start-button absolute left-4 top-4 vintage-button" onClick={changeLanguage}>{language.toUpperCase()}</button>
          <br/>
          <br/>
          <p style={{fontSize: "1.2em"}}>{language == "br" ? "Selecione sua próxima aventura" : "Select your next adventure"}</p>
          <br/>
          <div className="table-books">
            <div className="text-content" style={{position: "relative"}}>
              <br/>
              <div id="slider" className="slider">
                <div className="wrapper">
                  <div id="items" className="items">
                  {validBooks && validBooks.map((book, index) => (
                    <span className="slide" key={index}>
                      <div className="content choice book" data-book-id={book.id}>
                        <div className="container">
                          <div className="up">
                            <div className="cover" style={{backgroundImage: `url("./images/${book.path}.webp")`}}>
                              <div className="year">
                                <p>{book.year}</p>
                              </div>
                            </div>
                            <div className="name">
                              {book[`name-${language}`]}
                            </div>
                          </div>
                        </div>
                      </div>
                    </span>
                  ))}
                  </div>
                </div>
                <a id="prev" className="control prev"></a>
                <a id="next" className="control next"></a>
              </div>
            </div>
          </div>
        </div>
      )}
      {currentBook && !hasStarted && (
        <div className="start-container">
          <p className="book-title">{currentBook[`name-${language}`]}</p>
          <button className="start-button absolute left-4 top-4 vintage-button" onClick={changeLanguage}>{language.toUpperCase()}</button>
          <br/>
          <button onClick={changeSelectedBook} className="ml-4 p-2 bg-red-500 vintage-button">{language === "br" ? "Selecionar outro livro" : "Select another book"}</button>
          <button onClick={startAdventure} className="start-button vintage-button">{language === "br" ? "Iniciar uma nova aventura" : "Start a new adventure"}</button>
          <div className="table-chapters">
            <div className="text-content">
              <br/>
              {language == "br" ? "Ou selecione um capítulo" : "Or select a chapter"}
              <ul>
                {[...Array((currentBook.sections || 0) + 1).keys()]
                  .filter((section) => section !== 0) // Exclude section 0
                  .map((section) => (
                    <li>
                      <p key={section} className="choice chapter"><a href={"chapter" + section + ".html"}>{section}</a></p>
                    </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {currentBook && hasStarted && currentSection != null && (
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
                    <img alt="Combat ratio table - negative" className="max-w-full h-auto rounded-lg shadow" src="images/crtneg.png"></img>
                    <img alt="Combat ratio table - positive" className="max-w-full h-auto rounded-lg shadow" src="images/crtpos.png"></img>
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

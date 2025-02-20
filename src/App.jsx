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
  const [currentBookIndex, setCurrentBookIndex] = useState(null);
  const [content, setContent] = useState("");
  const [audio, setAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(currentSection);
  const [audioProgress, setAudioProgress] = useState(0); // Progress bar state
  const [audioDuration, setAudioDuration] = useState(0); // Audio duration state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [sectionContents, setSectionContents] = useState({});
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isCombatSection, setIsCombatSection] = useState(false);
  const [expandedCombatRatio, setExpandedCombatRatio] = useState(false);
  const [isDeadEnd, setIsDeadEnd] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState(null);
  const [isDiceSection, setIsDiceSection] = useState(false);
  const [newBookId, setNewBookId] = useState(null);

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

  const clearVisitedSections = () => {    
    setVisitedSections([]);
    localStorage.setItem("visitedSections", JSON.stringify([]));
  }

  const changeSelectedBook = (event, newBook) => {
    clearVisitedSections();
    resetSection();
    if (typeof newBook === "string") {      
      setCurrentBookInfo(newBook);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setCurrentBook(null);
      localStorage.removeItem("currentBook"); // <-- Ensure localStorage is cleared
    }
  }

  const startAdventure = (event, section) => {
    clearVisitedSections();
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
    clearVisitedSections();
    localStorage.removeItem("currentSection");
    stopAudio();
    setCurrentSection(null);
    setHasStarted(false);
  };

  useEffect(() => {
    setTimeout(function() { 
      parchmentHeight();
    }, 25);
  }, [currentBook, currentSection, content, expandedCombatRatio])

  const parchmentHeight = () => {
    const parchment = document.querySelector('.parchment');
    const content = document.querySelector('.content');

    if (!parchment || !content) return;
  
    // SVG feTurbulence can modify all others elements, for this reason "parchment" is in another <div> and in absolute position.
    // so for a better effect, absolute height is defined by his content.
    parchment.style.height = (content.offsetHeight + 150) + 'px';

    window.addEventListener('resize', parchmentHeight);

    return () => {
      window.removeEventListener("resize", parchmentHeight);
    };
  }

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

    fetch(`${import.meta.env.BASE_URL}${currentBook.id}/text/${language}/${section}.html`)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        const decoder = new TextDecoder("utf-8");
        const decodedContent = decoder.decode(buffer);
        let newIsDiceSection = false;
        
        // Modify the first paragraph
        const parser = new DOMParser();
        const doc = parser.parseFromString(decodedContent, "text/html");
        // Replace external <a> elements
        doc.querySelectorAll(`a${removeChoices ? '' : ':not(.choice a)'}`).forEach((a) => {
          if (a.getAttribute("href").indexOf("random.htm") !== -1) {
            newIsDiceSection = true;
            a.setAttribute("data-random", "true");
            a.innerHTML = "🎲";
          }
          if (a.getAttribute("href").indexOf("map.htm") !== -1) {
            a.setAttribute("data-map", "true");
            return;
          }
          if (a.getAttribute("href").indexOf("title.htm") !== -1) {
            a.setAttribute("data-title", "true");
            return;
          }
          const span = document.createElement("span");
          span.className = "external";
          span.innerHTML = a.innerHTML;
          a.replaceWith(span);
        });
        doc.querySelectorAll("figure img").forEach((i) => {
          const src = i.getAttribute("src").replace("png", "gif");
          i.setAttribute("src", `${import.meta.env.BASE_URL}${currentBook.id}/images/${src}`);
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

    const newAudio = new Audio(`${import.meta.env.BASE_URL}${currentBook.id}/audio/${language}/${section}.mp3`);
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
    if (!audio || isNaN(audio.duration) || audio.duration === 0) return;
  
    // Ensure we are getting the correct target
    let progressBar = event.currentTarget; // safer than event.target
  
    if (!progressBar || progressBar.clientWidth === 0) return; // Prevent division by zero
  
    let clickPosition = event.clientX - progressBar.getBoundingClientRect().left;
    let relativePosition = clickPosition / progressBar.clientWidth;
  
    if (isNaN(relativePosition) || !isFinite(relativePosition)) return; // Ensure it's valid
  
    audio.currentTime = relativePosition * audio.duration;
    audio.play();
    setIsPlaying(true);
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

  const toggleMap = () => {
    setIsMapOpen(!isMapOpen);
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

  const handleBookClick = (event) => {
    const bookId = event.target.dataset["bookId"];
    setCurrentBookInfo(bookId);
  }

  const handleChapterClick = (target) => {
    const newSection = parseInt(target.getAttribute("href").replace("chapter", "").replace(".html", ""));
    startAdventure(null, newSection);
  }

  const handleMapClick = () => {
    setIsMapOpen(true);
  }

  const handleNewBookClick = (target) => {
    const bookId = target.getAttribute("href").match(/\/([^\/]+)\/title\.htm$/);
    changeSelectedBook(null, bookId[1]);
  }

  const handleChoiceClick = (target) => {
    const newSection = parseInt(target.getAttribute("href").replace("sect", "").replace(".htm", ""));
    setCurrentSection(newSection);
  };

  // Set handlers
  useEffect(() => {
    const contentContainer = document.querySelector(".text-content");
    if (!contentContainer) return;
    
    contentContainer.addEventListener("click", (event) => {

      let target = event.target;
      if (event.target.parentElement.matches("a")) {
        target = event.target.parentElement;
      }

      if (!target) return;

      stopDefaultHandler(event);

      if (target.matches(".choice.chapter a")) {
        handleChapterClick(target);
      }
      else if (target.dataset["map"]) {
        handleMapClick();
      }
      else if (target.dataset["title"]) {
        handleNewBookClick(target);
      }
      else if (target.matches(".choice:not(.chapter) a")) {
        handleChoiceClick(target);
      }
    });
    
    return () => {
      contentContainer.removeEventListener("click", handleChapterClick);
      contentContainer.removeEventListener("click", handleChoiceClick);
    };
  }, [currentBook, content, currentSection]);

  // Carousel with dragn and wheel
  useEffect(() => {
    if (!validBooks || validBooks.length == 0) return;
    if (currentBook) return;

    /*--------------------
    Vars
    --------------------*/
    let progress = 0
    let startX = 0
    let active = 0
    let isDown = false

    /*--------------------
    Contants
    --------------------*/
    const speedWheel = 0.02
    const speedDrag = -0.1

    /*--------------------
    Get Z
    --------------------*/
    const getZindex = (array, index) => (array.map((_, i) => (index === i) ? array.length : array.length - Math.abs(index - i)))

    /*--------------------
    Items
    --------------------*/
    const $items = document.querySelectorAll('.carousel-item')

    const displayItems = (item, index, active) => {
      const zIndex = getZindex([...$items], active)[index]
      item.style.setProperty('--zIndex', zIndex)
      item.style.setProperty('--active', (index-active)/$items.length)

      if (item.style.getPropertyValue("--active") == "0") {
        setCurrentBookIndex(item.dataset["bookId"]);
      }
    }

    /*--------------------
    Animate
    --------------------*/
    const animate = () => {
      progress = Math.max(0, Math.min(progress, 100))
      active = Math.floor(progress/100*($items.length-1))
      
      $items.forEach((item, index) => displayItems(item, index, active))
    }
    animate()

    /*--------------------
    Click on Items
    --------------------*/
    $items.forEach((item, i) => {
      item.addEventListener('click', () => {
        progress = (i/$items.length) * 100 + 20
        animate()
      })
    })

    /*--------------------
    Handlers
    --------------------*/
    const handleWheel = e => {
      const wheelProgress = e.deltaY * speedWheel
      progress = progress + wheelProgress
      animate()
    }

    const handleMouseMove = (e) => {
      if (!isDown) return
      const x = e.clientX || (e.touches && e.touches[0].clientX) || 0
      const mouseProgress = (x - startX) * speedDrag
      progress = progress + mouseProgress
      startX = x
      animate()
    }

    const handleMouseDown = e => {
      isDown = true
      startX = e.clientX || (e.touches && e.touches[0].clientX) || 0
    }

    const handleMouseUp = () => {
      isDown = false
    }

    /*--------------------
    Listeners
    --------------------*/
    document.addEventListener('mousewheel', handleWheel)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchstart', handleMouseDown)
    document.addEventListener('touchmove', handleMouseMove)
    document.addEventListener('touchend', handleMouseUp)

  }, [validBooks, currentBook]);

  useEffect(() => {
    if (!currentBookIndex) return;

    const btnTitle = document.querySelector(".wood-button.book-title");
    if (!btnTitle) return;

    const book = validBooks.find(e => e.id === currentBookIndex);
    btnTitle.innerHTML = book[`name-${language}`];
    btnTitle.dataset["bookId"] = book.id;

  }, [currentBookIndex, language, currentBook])

  return (
    <div className="app-container">
      <button className="wood-button corner-bottom-right" onClick={changeLanguage}>{language.toUpperCase()}</button>
      {!currentBook && (
        <div className="book-container">
          <div className="carved">{language == "br" ? "Lobo Solitário" : "Lone Wolf"}</div>
          <div className="carved sub">{language == "br" ? "Selecione sua próxima aventura" : "Select your next adventure"}</div>
          <button className="wood-button book-title" data-book-id="" onClick={(event) => {handleBookClick(event)}}>
            {language == "br" ? "Escolha um livro" : "Choose a boook"}
          </button>
          <div className="carousel">
            {validBooks && validBooks.map((book, index) => (
              <div className="carousel-item" key={index} data-book-id={book.id}>
                <div className="carousel-box">
                  <div className="book-item">
                    <div className="main-book-wrap">
                      <div className="book-cover">
                        <div className="book-inside"></div>
                        <div className="book-image">       
                          <span className="ribbon">{book.order}</span>                   
                          <img src={`${import.meta.env.BASE_URL}${book.id}/images/cover.webp`} alt={`#${book.order} book cover`}></img>
                          <div className="effect"></div>
                          <div className="light"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="carousel-controls">
            {/* <button className="carousel-prev" onClick={() => {moveCarousel(-1)}}>&#10094;</button>
            <button className="carousel-next" onClick={() => {moveCarousel(1)}}>&#10095;</button> */}
          </div>
        </div>
      )}
      {currentBook && !hasStarted && (
        <div>
          <div className="carved">{currentBook[`name-${language}`]}</div>
          <div className="chapters">
            <div className="parchment" style={{"marginTop": "0"}}></div>
            <div className="content">
              <div className="section-controls">
                <button onClick={changeSelectedBook} className="wood-button">{language === "br" ? "Selecionar outro livro" : "Select another book"}</button>
                <button onClick={startAdventure} className="wood-button">{language === "br" ? "Iniciar uma nova aventura" : "Start a new adventure"}</button>
              </div>
              <div className="text-content">
                <div className="title" style={{"fontSize": "1.2em", "lineHeight": "2em", "marginTop": "1.2em"}}>
                  {language == "br" ? "Ou selecione um capítulo" : "Or select a chapter"}
                </div>                
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
              <div className="wax-seal parchment-end">{language == "br" ? "LS" : "LW"}</div>
            </div>
          </div>
        </div>
      )}
      {currentBook && hasStarted && currentSection != null && (
        <div>
          <div className="carved">{currentBook[`name-${language}`]}</div>
          <div className="section-controls">
            <button onClick={() => setIsModalOpen(true)} className="wood-button">{language === "br" ? "Relembre sua jornada" : "Remember your journey"}</button>
            <button onClick={resetSection} className="wood-button">{language === "br" ? "Reiniciar aventura" : "Restart adventure"}</button>
            {isModalOpen && (
              <div className="modal-overlay" onClick={() => {
                  setIsModalOpen(false);
                  setExpandedSection(null);
                }}>
                <div className="modal-wrapper">
                  <img src={`${import.meta.env.BASE_URL}images/background-modal.png`}></img>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="title" style={{ "margin": "2rem"}}>{language === "br" ? "Sua jornada" : "Your journey"}</div>
                    <div className="modal-overflow">
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
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="wood-button">{language === "br" ? "Fechar" : "Close"}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="parchment"></div>
          <div className="content">
            <div className="section-controls">
              {currentSection != 0 && (
                <div className="title">
                  <div className="wax-seal">{currentSection}</div>
                </div>
              )}
              <div className="map-container">
                <img src={`${import.meta.env.BASE_URL}images/icon-map.png`} alt="Map icon" onClick={toggleMap} ></img>
              </div>
              {isMapOpen && (
              <div className="modal-overlay" onClick={() => {
                  setIsMapOpen(false);
                }}>
                <div className="modal-wrapper">
                  <img src={`${import.meta.env.BASE_URL}${currentBook.id}/images/map.png`} style={{"borderRadius": "20px"}}></img>
                </div>
              </div>
            )}
              <div className="audio-player">
                <div className="audio-controls">
                  <button onClick={togglePlayPause} className="wood-button">
                    {isPlaying ? <Pause /> : <Play />}
                  </button>
                  <button onClick={stopAudio} className="wood-button">
                    <StopCircle />
                  </button>
                  <button onClick={restartAudio} className="wood-button">
                    <RotateCcw />
                  </button>
                </div>
                <div 
                  className="audio-progress-bar"
                  onClick={handleProgressBarClick}
                >
                  <div
                    className="audio-progress"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
                <div className="audio-time">
                  <span>{formatTime(Math.floor(audioProgress / 100 * audioDuration))} / {formatTime(Math.floor(audioDuration))}</span>
                </div>
              </div>
            </div>
            {currentSection == 0 && (
              <div className="intro-content">
                <p className="first intro">
                    <span className="firstLetter">{language == "br" ? "O" : "T"}</span>
                    <span className="intro">{language == "br" ? " caminho até aqui..." : "he story so far…"}</span>
                </p>
              </div>
            )}
            <div className="text-content" dangerouslySetInnerHTML={{ __html: content }} />
            {isDiceSection && (
              <div className="dice-container">
                <div className={`dice ${rolling ? "rolling" : ""} wood-button`} onClick={rollDice}>
                  {rolling ? "🎲" : result ?? "🎲"}
                </div>
              </div>
            )}
            {isCombatSection && (
              <div>
                <button
                  onClick={() => toggleCombatRatio()}
                  className="wood-button"
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
      <svg>
        <filter id="wavy">
          <feTurbulence x="0" y="0" baseFrequency="0.02" numOctaves="5" seed="1"></feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="20"></feDisplacementMap>
        </filter>
      </svg>
    </div>
  );
}

import "./app.css";
import booksData from './books.json';
import characterTemplate from './character.json';
import combatResultTable from './combat-results.json';
import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";
import { Play, Pause, StopCircle, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

export default function LoneWolfPWA() {  
  const { language, setLanguage, t } = useLanguage();
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
  const [isVisitedSectionsModalOpen, setIsVisitedSectionsModalOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [sectionContents, setSectionContents] = useState({});
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isCombatSection, setIsCombatSection] = useState(false);
  const [expandedCombatRatio, setExpandedCombatRatio] = useState(false);
  const [isDeadEnd, setIsDeadEnd] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceResult, setDiceResult] = useState(null);
  const [isDiceSection, setIsDiceSection] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [character, setCharacter] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("character")) || characterTemplate;
    } catch (error) {
      return null; // Fallback in case of corrupted storage
    }
  });
  const combatEnemiesTemplate = [
    {
      "skill": null,
      "endurance": null,
      "ratio": null,
      "taken": null,
      "dealt": null,
      "dead": false
    }
  ]
  const [combatEnemies, setCombatEnemies] = useState(null);
  const [rollingCombatDice, setRollingCombatDice] = useState({});

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

  const toggleLanguage = () => {
    setLanguage(language === "br" ? "en" : "br");
    stopAudio();
  };

  const resetSection = () => {    
    clearVisitedSections();
    localStorage.removeItem("currentSection");
    stopAudio();
    setCurrentSection(null);
    setHasStarted(false);
  };

  const loadCharacter = () => {    
    let newCharacter = JSON.parse(localStorage.getItem("character")) || structuredClone(characterTemplate);
    localStorage.setItem("character", JSON.stringify(newCharacter));
    setCharacter(newCharacter);
  }

  const saveCharacter = (updatedCharacter) => {
    localStorage.setItem("character", JSON.stringify(updatedCharacter));
  }

  const resetCharacter = () => {
    localStorage.removeItem("character");
    setCharacter(characterTemplate);
  }
  
  useState(() => { loadCharacter(); }, [isCharacterModalOpen]);

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

  useEffect(() => {
    const timeout = setTimeout(function() { 
      parchmentHeight();
    }, 25);    

    return () => clearTimeout(timeout);
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
    setDiceResult(null);
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
          if (a.getAttribute("href").indexOf("action.htm") !== -1) {
            a.setAttribute("data-action", "true");
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

  const rollParchmentDice = () => {
    if (diceRolling) return; // Prevent multiple rolls

    setDiceRolling(true);
    
    // Simulate rolling time
    setTimeout(() => {
      const newRoll = rollDice();
      setDiceResult(newRoll);
      setDiceRolling(false);
    }, 1500); // Duration matches CSS animation
  };

  const rollDice = () => {    
    let newRoll = Math.floor(Math.random() * 10) + 1; // Generate 1-10
    if (newRoll === 10) {
      newRoll = 0;
    }
    return newRoll;
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

  const validateField = (value, length, max) => {
    if (
      value.length <= length && // Length restriction
      (
        !max || // Not a number, validate only length as string
        (
          value >= 0 && // Min number value restriction
          value <= max && // Max number value restriction
          !isNaN(value) // Ensure it's a valid number
        )
      )
    ) {
      return true;
    }
    return false;
  };

  const stopDefaultHandler = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    stopAudio();
  };

  useEffect(() => {
    if (!isCharacterModalOpen && !isMapModalOpen && !isVisitedSectionsModalOpen) {
      document.body.style.removeProperty("overflow");
    } else {
      document.body.style.setProperty("overflow", "hidden");
    }

  }, [isCharacterModalOpen, isMapModalOpen, isVisitedSectionsModalOpen])

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
      else if (target.dataset["action"]) {
        handleCharacterModalOpen(true);
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

  const handleBookClick = (event) => {
    const bookId = event.target.dataset["bookId"];
    setCurrentBookInfo(bookId);
  }

  const handleChapterClick = (target) => {
    const newSection = parseInt(target.getAttribute("href").replace("chapter", "").replace(".html", ""));
    startAdventure(null, newSection);
  }

  const handleMapClick = () => {
    setIsMapModalOpen(true);
  }

  const handleNewBookClick = (target) => {
    const bookId = target.getAttribute("href").match(/\/([^\/]+)\/title\.htm$/);
    changeSelectedBook(null, bookId[1]);
  }

  const handleChoiceClick = (target) => {
    const newSection = parseInt(target.getAttribute("href").replace("sect", "").replace(".htm", ""));
    setCurrentSection(newSection);
  };

  const handleCharacterModalOpen = (open) => {
    // Add enemies of the content
    const newEnemies = [...combatEnemiesTemplate];
    if (open) {
      try {
        const contentCombat = Array.from(document.querySelectorAll('p.combat')).map(p => {
          const text = p.textContent;
          let combatMatch, enduranceMatch;

          if (language === "br") {
              combatMatch = text.match(/HABILIDADE\s*DE\s*COMBATE\s*(\d+)/i);
              enduranceMatch = text.match(/RESISTÊNCIA\s*(\d+)/i);
          } else {
              combatMatch = text.match(/COMBAT(?:\s*SKILL)?\s*(\d+)/i);
              enduranceMatch = text.match(/ENDURANCE\s*(\d+)/i);
          }

          // Update the corresponding object in combatEnemiesTemplate
          return {
            skill: combatMatch ? parseInt(combatMatch[1], 10) : null,
            endurance: enduranceMatch ? parseInt(enduranceMatch[1], 10) : null,
            ratio: null,
            taken: null,
            dealt: null,
            dead: false
          };
        });        

        // Update newEnemies with the contentCombat data
        newEnemies.splice(0, newEnemies.length -1, ...contentCombat); // Replace starting with the new data
      } catch (e) {
        console.log(e);
      }
    }
    
    setIsCharacterModalOpen(open); 
    setDiceResult(null); 
    setCombatEnemies(newEnemies);
  };

  // Generic handler for input changes (numbers & strings)
  const handleCharacterChange = (event) => {

    const { name, value, max, maxLength } = event.target;
    if (!validateField(value, maxLength, max)) return;

    setCharacter((prev) => {
      const updatedCharacter = { ...prev, [name]: value };
      saveCharacter(updatedCharacter);
      return updatedCharacter;
    });
  };

  // Handler for array inputs (Kai, Weapons, Backpack, Special)
  const handleCharacterArrayChange = (category, index, field, value) => {
    if (!validateField(value, 99)) return;

    setCharacter((prev) => {
      const updatedArray = [...prev[category]];
      if (typeof updatedArray[index] === "object" || field) {
        updatedArray[index] = { ...updatedArray[index], [field]: value };
      } else {
        updatedArray[index] = value;
      }
      saveCharacter({ ...prev, [category]: updatedArray });
      return { ...prev, [category]: updatedArray };
    });
  };

  const handleEnemyArrayChange = (category, index, value) => {
    if (!validateField(value, 2, 99)) return;

    setCombatEnemies((prev) => {
      const updatedArray = [...prev];
      updatedArray[index] = { ...updatedArray[index], [category]: value };
      if (updatedArray.length === index + 1) {
        updatedArray.push(combatEnemiesTemplate);
      }
      // Check if the updated array is different from the previous state
      if (JSON.stringify(prev) === JSON.stringify(updatedArray)) {
        return prev; // No need to update state if it's the same
      }
      return updatedArray;
    });
  };

  const handleCombat = (index) => {
    if (!isCharacterModalOpen) return;

    const dice = document.getElementById(`dice-${index}`);
    if (!dice || dice.classList.contains('no-events')) return;

    const combatDices = document.querySelectorAll('[data-dice="combat"]')
    combatDices.forEach(e => e.classList.add('no-events'));

    dice.innerText = "🎲";
    setRollingCombatDice((prev) => ({ ...prev, [index]: true }));
    
    // Simulate rolling time
    setTimeout(() => {
      const newRoll = rollDice();
      dice.innerText = newRoll;
      setRollingCombatDice((prev) => ({ ...prev, [index]: false }));
      combatDices.forEach(e => e.classList.remove('no-events'));

      setCombatEnemies((prev) => {
        const updatedArray = prev.map((enemy, enemyIndex) => {
          if (enemy.dead || !enemy.skill) return enemy; // Keep dead enemies unchanged
          if (enemyIndex !== index) return enemy;
  
          let ratio = parseInt(character.skill) - parseInt(enemy.skill);
          if (ratio > 11) ratio = 11;
          if (ratio < -11) ratio = -11;
  
          const { enemy: enemyDamage, wolf } = combatResultTable[newRoll][ratio];
  
          enemy.ratio = ratio;
          enemy.taken = parseInt(enemy.taken ?? 0) + parseInt(enemyDamage);
          enemy.dealt = parseInt(enemy.dealt ?? 0) + parseInt(wolf);
          enemy.endurance -= parseInt(enemy.taken);
  
          if (enemy.endurance <= 0) {
            enemy.endurance = 0;
            enemy.dead = true;
          }
  
          return enemy;
        });
  
        // Update the character's endurance with the sum of all dealt values
        const totalDealt = updatedArray.filter((enemy) => !enemy.dead && enemy.skill).reduce((sum, enemy) => sum + parseInt(enemy.dealt || 0), 0);
        character.endurance = parseInt(character.endurance) - parseInt(totalDealt);
        saveCharacter(character);
  
        return updatedArray;
      });
    }, 1500); // Duration matches CSS animation
  }

  return (
    <div className="app-container">
      <div className="bottom-right-container">
        <button className="wood-button" onClick={toggleLanguage} title={t("switchLanguage")}>{language.toUpperCase()}</button>
        <button className="wood-button" onClick={() => handleCharacterModalOpen(!isCharacterModalOpen)}><img src={`${import.meta.env.BASE_URL}images/inventory.png`} alt="Map icon" title={t("showCharacter")} ></img></button>
        <button className="wood-button" onClick={() => setIsMapModalOpen(!isMapModalOpen)}><img src={`${import.meta.env.BASE_URL}images/icon-map.png`} alt="Map icon" title={t("showMap")} ></img></button>
      </div>
      {!currentBook && (
        <div className="book-container">
          <div className="carved">{t("title")}</div>
          <div className="carved sub">{t("selectAdventure")}</div>
          <button className="wood-button book-title" data-book-id="" onClick={(event) => {handleBookClick(event)}}>
            {t("chooseBook")}
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
      {currentBook && (
        <div>
          <div className="carved">{currentBook[`name-${language}`]}</div>
          {!hasStarted && (
            <div>
              <div className="chapters">
                <div className="parchment" style={{"marginTop": "0"}}></div>
                <div className="content">
                  <div className="section-controls">
                    <button onClick={changeSelectedBook} className="wood-button">{t("selectAnotherBook")}</button>
                    <button onClick={startAdventure} className="wood-button">{t("startAdventure")}</button>
                  </div>
                  <div className="text-content">
                    <div className="title" style={{"fontSize": "1.2em", "lineHeight": "2em", "marginTop": "1.2em"}}>
                      {t("selectChapter")}
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
                  <div className="wax-seal parchment-end">{t("signature")}</div>
                </div>
              </div>
            </div>
          )}               
          {hasStarted && currentSection != null && (
            <div>
              {isCharacterModalOpen && (
                <div className="modal-overlay" onClick={() => handleCharacterModalOpen(false)}>
                  <div className="modal-wrapper">
                    <div onClick={() => handleCharacterModalOpen(false)} className="close"></div>
                    <img src={`${import.meta.env.BASE_URL}images/background-modal.png`}></img>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>                      
                      <div className="title" style={{ "margin": "1rem"}}>
                        {t("character")}
                        <button onClick={resetCharacter} className="wood-button">{t("new")}</button>
                      </div>
                      {character && (
                        <div className="modal-overflow">
                          {/* Backpack Items, Belt Pouch & Meals */}
                          <div className="backpack-wrapper">
                            <div className="pouch">
                              <div>
                                <h4>{t("beltPouch")} (max. 50)</h4>
                                <input type="number"maxLength={2} max={50} className="square" name="coins" value={character.coins} onChange={handleCharacterChange} />
                              </div>
                              <div>
                                <h4>{t("meals")}</h4>
                                <input type="number" maxLength={2} max={99} className="square" name="meals" value={character.meals} onChange={handleCharacterChange} />
                              </div>
                            </div>
                            <div className="backpack">
                              <h4>{t("backpack")}</h4>
                              <table>
                                <tbody>
                                  {[...Array(4)].map((_, index) => (
                                    <tr key={index}>
                                      <td style={{width: "5%"}}>{index + 1}</td>
                                      <td>
                                        <input type="text" maxLength={100} className="inventoria" value={character.backpack[index]} onChange={(e) => handleCharacterArrayChange("backpack", index, "", e.target.value)} />
                                      </td>
                                      <td style={{width: "5%"}}>{index + 5}</td>
                                      <td>
                                        <input type="text" maxLength={100} className="inventoria" value={character.backpack[index + 4]} onChange={(e) => handleCharacterArrayChange("backpack", index + 4, "", e.target.value)} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <p>{t("canDiscart")}</p>
                            </div>
                          </div>
                          <div className="special-wrapper">
                            <h4>{t("specialItems")}</h4>
                            <table>
                              <thead>
                                <tr>
                                  <th>{t("description")}</th>
                                  <th>{t("knowEffects")}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...Array(character.special.length + 1)].map((_, index) => (
                                  <tr key={index}>
                                    <td>
                                      <input type="text" maxLength={100} className="inventoria" value={ index < character.special.length ? character.special[index].description : "" } onChange={(e) => handleCharacterArrayChange("special", index, "description", e.target.value)} />
                                    </td>
                                    <td>
                                      <input type="text" maxLength={100} className="inventoria" value={ index < character.special.length ? character.special[index].effect : "" } onChange={(e) => handleCharacterArrayChange("special", index, "effect", e.target.value)} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {/* Kai Disciplines */}
                          <div className="disciplines-wrapper">
                            <h4>{t("kaiDisciplines")}</h4>
                            <table>
                              <thead>
                                <tr>
                                  <th>{t("name")}</th>
                                  <th>{t("rank")}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...Array(character.kai.length)].map((_, index) => (
                                  <tr key={index}>
                                    <td>
                                      <input type="text" maxLength={100} className="inventoria" value={ character.kai[index].discipline } onChange={(e) => handleCharacterArrayChange("kai", index, "discipline", e.target.value)} />
                                    </td>
                                    <td>
                                      <input type="text" maxLength={100} className="inventoria" value={ character.kai[index].rank } onChange={(e) => handleCharacterArrayChange("kai", index, "rank", e.target.value)} />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {/* Combat Skill, Endurance Points & Weapons */}
                          <div className="points-wrapper">
                            <div className="weapons">
                              <h4>{t("weapons")}</h4>
                              <table>
                                <tbody>
                                  <tr>
                                    <td><input type="text" maxLength={100} className="inventoria" value={character.weapons[0]} onChange={(e) => handleCharacterArrayChange("weapons", 0, "", e.target.value)} /></td>
                                    <td><input type="text" maxLength={100} className="inventoria" value={character.weapons[1]} onChange={(e) => handleCharacterArrayChange("weapons", 1, "", e.target.value)} /></td>
                                  </tr>
                                </tbody>
                              </table>
                              <p>{t("holdWeapon")}</p>
                              <p>{t("noWeapon")}</p>
                            </div>
                            <div className="points">
                              <div>
                                <h4>{t("combatSkill")}</h4>
                                <input type="number" maxLength={2} max={99} className="square" name="skill" value={character.skill} onChange={handleCharacterChange} />
                              </div>
                              <div className="combat-wolf">
                                <span>{(character.endurance ?? 0) > 0 ? "🐺" : "💀"}</span>
                              </div>
                              <div>
                                <h4>{t("endurance")}</h4>
                                <input type="number" maxLength={2} max={99} className="square" name="endurance" value={character.endurance} onChange={handleCharacterChange} />
                              </div>
                            </div>
                          </div>
                          {/* Combat Record Table */}
                          <div className="combat-wrapper">
                            <h4>{t("combat")}</h4>
                            <div className="combat-event">
                              <table>
                                <thead>
                                  <tr className="sub-header">
                                    <th>{t("enemy")}</th>
                                    <th>{t("skill")}</th>
                                    <th>{t("endurance")}</th>
                                    <th>{t("ratio")}</th>
                                    <th>🎲</th>
                                    <th>{t("enemy")} {t("lost")}</th>
                                    <th>{t("you")} {t("lost")}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(combatEnemies || []).map((enemy, index) => (
                                    <tr key={index}>
                                      <td title={enemy.skill == null ? t("noSkill") : enemy.dead ? t("dead") : t("alive")}>{enemy.skill == null ? "🪵" : enemy.dead ? "💀" : "🧌"}</td>
                                      <td><input type="number" maxLength={2} max={99} className="square" data-index={index} value={enemy.skill ?? ""} onChange={(e) => handleEnemyArrayChange("skill", index, e.target.value)} /></td>
                                      <td><input type="number" maxLength={2} max={99} className="square" data-index={index} value={enemy.endurance ?? ""} onChange={(e) => handleEnemyArrayChange("endurance", index, e.target.value)} /></td>
                                      <td><input type="number" maxLength={2} max={99} className="square" data-index={index} value={enemy.ratio ?? ""} readOnly /></td>
                                      <td>
                                        <div className="dice-container">
                                          <div className={`dice ${rollingCombatDice[index] ? "rolling no-events" : ""} wood-button`} data-dice="combat" id={`dice-${index}`} onClick={(e) => handleCombat(index)}>🎲</div>
                                        </div>
                                      </td>
                                      <td><input type="number" maxLength={2} max={99} className="square" data-index={index} value={enemy.taken ?? ""} readOnly /></td>
                                      <td><input type="number" maxLength={2} max={99} className="square" data-index={index} value={enemy.dealt ?? ""} readOnly /></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}                      
                    </div>
                  </div>
                </div>
              )}
              <div className="section-controls">
                <button onClick={() => setIsVisitedSectionsModalOpen(true)} className="wood-button">{t("rememberJourney")}</button>
                <button onClick={resetSection} className="wood-button">{t("restartAdventure")}</button>
                {isVisitedSectionsModalOpen && (
                  <div className="modal-overlay" onClick={() => {
                      setIsVisitedSectionsModalOpen(false);
                      setExpandedSection(null);
                    }}>
                    <div className="modal-wrapper">
                      <div onClick={() => setIsVisitedSectionsModalOpen(false)} className="close"></div>
                      <img src={`${import.meta.env.BASE_URL}images/background-modal.png`}></img>
                      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="title" style={{ "margin": "2rem"}}>{t("yourJourney")}</div>
                        <div className="modal-overflow">
                          <ul>
                            {visitedSections.slice().reverse().map((section) => (
                              <li key={section}>
                                <button
                                  onClick={() => toggleSection(section)}
                                  className="section-toggle"
                                >
                                  {t("chapter")} {section} {expandedSection === section ? <ChevronUp /> : <ChevronDown />}
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
                  {isMapModalOpen && (
                    <div className="modal-overlay" onClick={() => { setIsMapModalOpen(false); }}>
                      <div className="modal-wrapper">
                        <div onClick={() => setIsMapModalOpen(false)} className="close"></div>
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
                    <div className="audio-progress-bar" onClick={handleProgressBarClick} >
                      <div
                        className="audio-progress" style={{ width: `${audioProgress}%` }} />
                    </div>
                    <div className="audio-time">
                      <span>{formatTime(Math.floor(audioProgress / 100 * audioDuration))} / {formatTime(Math.floor(audioDuration))}</span>
                    </div>
                  </div>
                </div>
                {currentSection == 0 && (
                  <div className="intro-content">
                    <p className="first intro">
                        <span className="intro">{t("storySoFar")}</span>
                    </p>
                  </div>
                )}
                <div className="text-content" dangerouslySetInnerHTML={{ __html: content }} />
                {isDiceSection && (
                  <div className="dice-container">
                    <div className={`dice ${diceRolling ? "rolling no-events" : ""} wood-button`} onClick={rollParchmentDice}>
                      {diceRolling ? "🎲" : diceResult ?? "🎲"}
                    </div>
                  </div>
                )}
                {isCombatSection && (
                  <div>
                    <button onClick={() => toggleCombatRatio()} className="wood-button">
                      {t("combatTable")}
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

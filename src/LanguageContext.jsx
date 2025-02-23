import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  title: { en: "Lone Wolf", br: "Lobo Solitário" },
  signature: { en: "LW", br: "LS" },
  selectAdventure: { en: "Select your next adventure", br: "Selecione sua próxima aventura" },
  chooseBook: { en: "Choose a book", br: "Escolha um livro" },
  selectAnotherBook: { en: "Select another book", br: "Selecionar outro livro" },
  startAdventure: { en: "Start a new adventure", br: "Iniciar uma nova aventura" },
  selectChapter: { en: "Or select a chapter", br: "Ou selecione um capítulo" },
  rememberJourney: { en: "Remember your journey", br: "Relembre sua jornada" },
  restartAdventure: { en: "Restart adventure", br: "Reiniciar aventura" },
  yourJourney: { en: "Your journey", br: "Sua jornada" },
  chapter: { en: "Chapter", br: "Capítulo" },
  storySoFar: { en: "The story so far...", br: "O caminho até aqui..."},
  combatTable: { en: "Combat table", br: "Tabela de combate" },
  switchLanguage: { en: "Switch to Portuguese", br: "Troque para Inglês" },
  showCharacter: { en: "Show character sheet", br: "Exibir ficha de personagem" },
  showMap: { en: "Show map", br: "Exibir mapa" },
  character: { en: "Character", br: "Personagem" },
  new: { en: "New", br: "Novo" },
  beltPouch: { en: "Belt pouch", br: "Bolsa de cinto" },
  meals: { en: "Meals", br: "Refeições" },
  backpack: { en: "Backpack", br: "Mochila" },
  canDiscart: { en: "Can be discarded when not in combat", br: "Pode ser descartado quando não estiver em combate" },
  specialItems: { en: "Special items", br: "Itens especiais" },
  description: { en: "Description", br: "Descrição" },
  knowEffects: { en: "Effects", br: "Efeitos" },
  kaiDisciplines: { en: "Kai disciplines", br: "Disciplinas Kai" },
  name: { en: "Name", br: "Nome" },
  rank: { en: "Rank", br: "Nível" },
  weapons: { en: "Weapons", br: "Armas" },
  holdWeapon: { en: "If holding weapon and appropriate weapon skill in combat +2CS", br: "Se estiver segurando uma arma e a habilidade de arma apropriada em combate +2CS" },
  noWeapon: { en: "If combat entered carrying no Weapon -4CS", br: "Se não estiver carregando nenhuma arma no combate -4CS" },
  combatSkill: { en: "Combat skill", br: "Habilidade" },
  endurance: { en: "Endurance", br: "Resistência" },
  combat: { en: "Combat", br: "Combate" },
  enemy: { en: "Enemy", br: "Inimigo" },
  skill: { en: "Skill", br: "Habilitade" },
  ratio: { en: "Ratio", br: "Razão" },
  lost: { en: "lost", br: "perdeu" },
  you: { en: "You", br: "Você" },
  noSkill: { en: "No skill", br: "Sem habilidade" },
  dead: { en: "Dead", br: "Morto" },
  alive: { en: "Alive", br: "Vivo" }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "br");

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);
  
  const t = (key) => {
    if (!translations[key]) {
      console.warn(`Missing translation key: "${key}"`);
    }
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

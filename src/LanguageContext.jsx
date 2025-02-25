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
  max: { en: "max.", br: "máx." },
  beltPouch: { en: "Gold crowns", br: "Coroas de ouro" },
  meals: { en: "Meals", br: "Refeições" },
  meal: { en: "Meal", br: "Refeição" },
  backpack: { en: "Backpack", br: "Mochila" },
  canDiscart: { en: "Can be discarded when not in combat", br: "Pode ser descartado quando não estiver em combate" },
  specialItems: { en: "Special items", br: "Itens especiais" },
  description: { en: "Description", br: "Descrição" },
  knowEffects: { en: "Effects", br: "Efeitos" },
  kaiDisciplines: { en: "Kai disciplines", br: "Disciplinas Kai" },
  name: { en: "Name", br: "Nome" },
  rank: { en: "Rank", br: "Nível" },
  weapons: { en: "Weapons", br: "Armas" },
  holdWeapon: { en: "If holding weapon and appropriate weapon skill in combat +2CS", br: "Se estiver segurando uma arma e tenha Habilidade com arma apropriada em combate +2CS" },
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
  alive: { en: "Alive", br: "Vivo" },
  camouflage: { en: "Camouflage", br: "Camuflagem" },
  hunting: { en: "Hunting", br: "Caça" },
  sixthSense: { en: "Sixth sense", br: "Sexto sentido" },
  tracking: { en: "Tracking", br: "Rastreamento" },
  healing: { en: "Healing", br: "Cura" },
  weaponSkill: { en: "Weaponskill", br: "Habilidade com arma" },
  mindShield: { en: "Mindshield", br: "Escudo mental" },
  mindBlast: { en: "Mindblast", br: "Explosão mental" },
  animalKinship: { en: "Animal kinship", br: "Parentesco animal" },
  mindOverMatter: { en: "Mind over matter", br: "Mente sobre a matéria" },
  novice: { en: "Novice", br: "Novato" },
  intuite: { en: "Intuite", br: "Intuíto" },
  doan: { en: "Doan", br: "Doador" },
  acolyte: { en: "Acolyte", br: "Acolito" },
  initiate: { en: "Initiate", br: "Iniciado" },
  aspirant: { en: "Aspirant", br: "Aspirante" },
  guardian: { en: "Guardian", br: "Guardião" },
  journeyman: { en: "Journeyman", br: "Viajante" },
  savant: { en: "Savant", br: "Sábio" },
  master: { en: "Master", br: "Mestre" },
  dagger: { en: "Dagger", br: "Adaga" },
  spear: { en: "Spear", br: "Lança" },
  mace: { en: "Mace", br: "Maça" },
  shortSword: { en: "Short sword", br: "Espada curta" },
  warhammer: { en: "Warhammer", br: "Martelo de batalha" },
  sword: { en: "Sword", br: "Espada" },
  axe: { en: "Axe", br: "Machado" },
  quarterstaff: { en: "Quarterstaff", br: "Bastão" },
  broadsword: { en: "Broadsword", br: "Espada longa" },
  helmet: { en: "Helmet", br: "Capacete" },
  twoMeals: { en: "2 Meals", br: "2 Refeições" },
  chainmail: { en: "Chainmail", br: "Cota de malha" },
  healingPotion: { en: "Healing potion (restore 4 endurance)", br: "Poção de cura (recupera 4 resistência)" },
  coins12: { en: "12 gold crowns", br: "12 coroas de ouro" },
  endurance2: { en: "+2 endurance", br: "+2 resistência" },
  endurance4: { en: "+4 endurance", br: "+4 resistência" },
  youFound: { en: "You found:", br: "Você encontrou:" }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "br");

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);
  
  const t = (key) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

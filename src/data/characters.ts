export type CharacterDefinition = {
  id: string;
  name: string;
  trait: string;
};

export const characterDefinitions: CharacterDefinition[] = [
  {
    id: "knight",
    name: "Knight",
    trait: "Balanced starter",
  },
  {
    id: "duelist",
    name: "Duelist",
    trait: "Fast attacks",
  },
  {
    id: "guardian",
    name: "Guardian",
    trait: "Sturdy defense",
  },
];

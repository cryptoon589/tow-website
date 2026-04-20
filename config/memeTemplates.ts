export interface MemeTextField {
  id: string;
  label: string;
  defaultText: string;
  x: number;
  y: number;
  maxWidth: number;
  align?: "left" | "center" | "right";
}

export interface MemeTemplate {
  id: string;
  name: string;
  imagePath: string;
  width: number;
  height: number;
  textFields: MemeTextField[];
}

export interface MemeCategory {
  id: string;
  label: string;
  templates: MemeTemplate[];
}

const defaultTextFields: MemeTextField[] = [
  {
    id: "top",
    label: "Top Text",
    defaultText: "TOP TEXT",
    x: 300,
    y: 80,
    maxWidth: 560,
    align: "center",
  },
  {
    id: "bottom",
    label: "Bottom Text",
    defaultText: "BOTTOM TEXT",
    x: 300,
    y: 540,
    maxWidth: 560,
    align: "center",
  },
];

export const memeCategories: MemeCategory[] = [
  {
    id: "dad",
    label: "Dad",
    templates: [
      {
        id: "dad-doorway",
        name: "Doorway",
        imagePath: "/assets/memes/templates/dad-doorway.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "dad-coffee",
        name: "Coffee",
        imagePath: "/assets/memes/templates/dad-coffee.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
    ],
  },
  {
    id: "son",
    label: "Son",
    templates: [
      {
        id: "son-desk",
        name: "Desk",
        imagePath: "/assets/memes/templates/son-desk.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "son-standing",
        name: "Standing",
        imagePath: "/assets/memes/templates/son-standing.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
    ],
  },
  {
    id: "girlfriend",
    label: "Girlfriend",
    templates: [
      {
        id: "girlfriend-crossed",
        name: "Arms Crossed",
        imagePath: "/assets/memes/templates/girlfriend-crossed.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "girlfriend-sideeye",
        name: "Side Eye",
        imagePath: "/assets/memes/templates/girlfriend-sideeye.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
    ],
  },
  {
    id: "parody",
    label: "Parody",
    templates: [
      {
        id: "parody-trump",
        name: "Trump",
        imagePath: "/assets/memes/templates/parody-trump.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "parody-boss",
        name: "Boss",
        imagePath: "/assets/memes/templates/parody-boss.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
    ],
  },
];
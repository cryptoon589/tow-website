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
        id: "dad-1",
        name: "Dad-1",
        imagePath: "/assets/memes/templates/dad-1.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "dad-2",
        name: "Dad-2",
        imagePath: "/assets/memes/templates/dad-2.png",
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
        id: "son-1",
        name: "Son-1",
        imagePath: "/assets/memes/templates/son-1.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "son-2",
        name: "Son-2",
        imagePath: "/assets/memes/templates/son-2.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "son-3",
        name: "Son-3",
        imagePath: "/assets/memes/templates/son-3.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "son-4",
        name: "Son-4",
        imagePath: "/assets/memes/templates/son-4.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "son-5",
        name: "Son-5",
        imagePath: "/assets/memes/templates/son-5.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "son-6",
        name: "Son-6",
        imagePath: "/assets/memes/templates/son-6.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "son-7",
        name: "Son-7",
        imagePath: "/assets/memes/templates/son-7.png",
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
        id: "girlfriend-1",
        name: "Girlfriend-1",
        imagePath: "/assets/memes/templates/girlfriend-1.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "girlfriend-2",
        name: "Girlfriend-2",
        imagePath: "/assets/memes/templates/girlfriend-2.png",
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
        id: "parody-1",
        name: "Parody-1",
        imagePath: "/assets/memes/templates/parody-1.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
      {
        id: "parody-2",
        name: "Parody-2",
        imagePath: "/assets/memes/templates/parody-2.png",
        width: 600,
        height: 600,
        textFields: defaultTextFields,
      },
    ],
  },
];
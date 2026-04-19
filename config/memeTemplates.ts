export interface MemeTemplate {
  id: string; name: string; imagePath: string; width: number; height: number;
  textFields: { id: string; label: string; defaultText: string; x: number; y: number; maxWidth: number; align?: "left" | "center" | "right"; }[];
}
export const memeTemplates: MemeTemplate[] = [
  { id: "dad-and-dad", name: "Dad and Dad", imagePath: "/assets/memes/templates/dad-and-dad.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
  { id: "son-and-son", name: "Son and Son", imagePath: "/assets/memes/templates/son-and-son.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
  { id: "girlfriend-and-girlfriend", name: "Girlfriend and Girlfriend", imagePath: "/assets/memes/templates/girlfriend-and-girlfriend.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
  { id: "parody-and-parody", name: "Parody and Parody", imagePath: "/assets/memes/templates/parody-and-parody.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
];
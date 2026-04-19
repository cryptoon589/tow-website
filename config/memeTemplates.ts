export interface MemeTemplate {
  id: string; name: string; imagePath: string; width: number; height: number;
  textFields: { id: string; label: string; defaultText: string; x: number; y: number; maxWidth: number; align?: "left" | "center" | "right"; }[];
}
export const memeTemplates: MemeTemplate[] = [
  { id: "dad", name: "Dad", imagePath: "/assets/memes/templates/dad.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
  { id: "son", name: "Son", imagePath: "/assets/memes/templates/son.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
  { id: "girlfriend", name: "Girlfriend", imagePath: "/assets/memes/templates/girlfriend.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
  { id: "parody", name: "Parody", imagePath: "/assets/memes/templates/parody.png", width: 600, height: 600,
    textFields: [{ id: "top", label: "Top Text", defaultText: "TOP TEXT", x: 300, y: 80, maxWidth: 560, align: "center" }, { id: "bottom", label: "Bottom Text", defaultText: "BOTTOM TEXT", x: 300, y: 540, maxWidth: 560, align: "center" }] },
];
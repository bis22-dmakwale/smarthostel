export function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.onload = () => {
      if (typeof reader.result !== "string") reject(new Error(`Unable to read ${file.name}.`));
      else resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

import fs from 'node:fs';
import path from 'node:path';

export function createFsService({ folder }) {
  function readFile({ filename }) {
    const content = fs.readFileSync(path.join(folder, filename), 'utf8');
    return content;
  }

  function writeFile({ filename, content }) {
    // Ensure the folder exists
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    fs.writeFileSync(path.join(folder, filename), content, 'utf8');
    return `Wrote content to ${filename}`;
  }

  function appendFile({ filename, content }) {
    // Ensure the folder exists
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    fs.appendFileSync(path.join(folder, filename), content);
    return `Appended content to ${filename}`;
  }

  function deleteFile({ filename }) {
    fs.unlinkSync(path.join(folder, filename));
    return `Deleted ${filename}`;
  }

  return {
    readFile,
    writeFile,
    appendFile,
    deleteFile,
  };
}

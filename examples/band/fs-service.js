import fs from 'node:fs';
import path from 'node:path';

export function createFsService({ folder }) {
  function fileExists({ filename }) {
    return fs.existsSync(path.join(folder, filename));
  }

  function createFile({ filename }) {
    // Ensure the folder exists
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    fs.writeFileSync(path.join(folder, filename), '', 'utf8');
    return `Created ${filename}`;
  }

  function readFile({ filename }) {
    return fs.readFileSync(path.join(folder, filename), 'utf8');
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
    fileExists,
    createFile,
    readFile,
    // writeFile,
    appendFile,
    deleteFile,
  };
}

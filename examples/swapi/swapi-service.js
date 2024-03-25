// The Star Wars API
// https://swapi.dev/

export function createSwapiService({ isDebug = false }) {
  const baseUrl = 'https://swapi.dev/api';

  function getData(url) {
    return fetch(url).then(async (response) => {
      const res = await response.json();
      if (isDebug) {
        console.log(res);
      }
      return res;
    });
  }

  // https://swapi.dev/documentation#people
  const getPlanets = async function () {
    const { results } = await getData(`${baseUrl}/planets/`);
    return results;
  };

  const getPlanet = async function ({ id }) {
    const result = await getData(`${baseUrl}/planets/${id}/`);
    return result;
  };

  // https://swapi.dev/documentation#people
  const getPeople = async function () {
    const { results } = await getData(`${baseUrl}/people/`);
    return results;
  };

  const getPerson = async function ({ id }) {
    const result = await getData(`${baseUrl}/people/${id}/`);
    return result;
  };

  // https://swapi.dev/documentation#starships
  const getStarships = async function () {
    const { results } = await getData(`${baseUrl}/starships/`);
    return results;
  };

  const getStarship = async function ({ id }) {
    const result = await getData(`${baseUrl}/starships/${id}/`);
    return result;
  };

  // https://swapi.dev/documentation#vehicles
  const getVehicles = async function () {
    const { results } = await getData(`${baseUrl}/vehicles/`);
    return results;
  };

  const getVehicle = async function ({ id }) {
    const result = await getData(`${baseUrl}/vehicles/${id}/`);
    return result;
  };

  // https://swapi.dev/documentation#species
  const getSpecies = async function () {
    const { results } = await getData(`${baseUrl}/species/`);
    return results;
  };

  const getSpecie = async function ({ id }) {
    const result = await getData(`${baseUrl}/species/${id}/`);
    return result;
  };

  return {
    getPlanets,
    getPlanet,
    getPeople,
    getPerson,
    getStarships,
    getStarship,
    getVehicles,
    getVehicle,
    getSpecies,
    getSpecie,
  };
}

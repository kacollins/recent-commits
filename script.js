class Person {
  constructor(gitHubUserName, firstName, lastName, active) {
    this.GitHubUserName = gitHubUserName;
    this.FirstName = firstName;
    this.LastName = lastName;
    this.Active = active === "true";
    this.LastCommitDate = null;
  }

  get FullName() {
    return `${this.FirstName} ${this.LastName}`;
  }

  get DaysAgo() {
    return this.LastCommitDate ? Math.floor((new Date() - this.LastCommitDate) / (24 * 60 * 60 * 1000)) : null;
  }

  get URL() {
    return `https://github.com/${this.GitHubUserName}`;
  }
}

async function getLastCommitDatesForPeople(people) {
  for (const person of people.filter((p) => p.Active)) {
    person.LastCommitDate = await getLastCommitDate(person.GitHubUserName);
  }
}

async function getLastCommitDate(username) {
  const allRepositories = await getAllRepositories(username);

  let lastCommitDate = null;

  if (allRepositories.length > 0) {
    const pushedAtDates = allRepositories.map(repo => new Date(repo.pushed_at));
    lastCommitDate = new Date(Math.max(...pushedAtDates));
  }

  return lastCommitDate;
}

async function getAllRepositories(username) {
  const rowsPerPage = 30;
  const maxPages = 3;
  let pageNumber = 1;
  let getMoreResults = true;
  const allRepositories = [];

  while (getMoreResults && pageNumber <= maxPages) {
    const repositories = await getPageOfRepositories(username, pageNumber, rowsPerPage);
    allRepositories.push(...repositories);
    pageNumber++;

    if (repositories.length < rowsPerPage) {
      getMoreResults = false;
    }
  }

  return allRepositories;
}

async function getPageOfRepositories(username, pageNumber, rowsPerPage = 30) {
  const apiUrl = `https://api.github.com/users/${username}/repos?page=${pageNumber}&per_page=${rowsPerPage}`;
  const headers = {
    "User-Agent": "recent-commits 1.0",
  };

  const response = await fetch(apiUrl, { headers });

  if (response.ok) {
    return await response.json();
  } else {
    console.error(`Failed to fetch data for user '${username}' on page ${pageNumber}. Status code: ${response.status}`);
    return [];
  }
}

const fs = require('fs');

function getData() {
  const data = fs.readFileSync('data.json');

  const jsonData = JSON.parse(data);

  return jsonData;
}

async function updateData(jsonData) {
  const people = jsonData.people.map(person => new Person(
    person.GitHubUserName.toString(),
    person.FirstName.toString(),
    person.LastName.toString(),
    person.Active.toString()
  ));

  await getLastCommitDatesForPeople(people);

  return people;
}

function saveData(jsonData) {
  try {
    const jsonString = JSON.stringify(jsonData, null, 4);
    fs.writeFileSync('data.json', jsonString, 'utf8');
    console.log('Data saved to data.json successfully.');
    return jsonString;
  } catch (error) {
    console.error('Error saving data to data.json:', error);
    return null;
  }
}

async function main() {
  const jsonData = getData();
  jsonData.people = await updateData(jsonData);
  saveData(jsonData);
  console.log(jsonData);
}

main();

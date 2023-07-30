class Person {
  constructor(gitHubUserName, firstName, lastName, active) {
    this.GitHubUserName = gitHubUserName;
    this.FirstName = firstName;
    this.LastName = lastName;
    this.Active = active === "true";
    this.LastCommitDateUTC = null;
  }

  get FullName() {
    return `${this.FirstName} ${this.LastName}`;
  }

  get LastCommitDateCDT() {
    return this.LastCommitDateUTC ? new Date(this.LastCommitDateUTC - 5 * 60 * 60 * 1000) : null;
  }

  get DaysAgo() {
    return this.LastCommitDateCDT ? Math.floor((new Date() - this.LastCommitDateCDT) / (24 * 60 * 60 * 1000)) : null;
  }

  get URL() {
    return `https://github.com/${this.GitHubUserName}`;
  }
}
async function main() {
  const people = getPeopleFromFile();

  await getLastCommitDatesForPeople(people);

  console.log("people", people);

  displayResults(people);
}

function getPeopleFromFile() {
  const people = data.people.map(person => new Person(
    person.username.toString(),
    person.firstname.toString(),
    person.lastname.toString(),
    person.active.toString()
  ));

  return people;
}

async function getLastCommitDatesForPeople(people) {
  for (const person of people.filter((p) => p.Active)) {
    person.LastCommitDateUTC = await getLastCommitDate(person.GitHubUserName);
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

function displayResults(people) {
  var peopleToInclude = people
    .filter((u) => u.Active && Number.isInteger(u.DaysAgo))
    .sort((a, b) => new Date(b.LastCommitDateUTC) - new Date(a.LastCommitDateUTC));

  var recentPeople = peopleToInclude.slice(0, 10);  
  var remainingPeople = peopleToInclude.slice(10);

  displayGroup('recent', recentPeople);
  displayGroup('remaining', remainingPeople);
}

function displayGroup(groupName, peopleToInclude) {
  var isRecent = groupName === 'recent';

  const groupDiv = document.getElementById(groupName);
  groupDiv.innerHTML = '';

  const header = document.createElement('h2');
  header.textContent = isRecent ? '10 Most Recent' : 'Everybody Else';
  groupDiv.appendChild(header);

  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group');

  var i = 1;
  const listItemClass = isRecent ? 'list-group-item-success' : 'list-group-item-secondary';

  peopleToInclude
    .forEach((person) => {
      const listItem = createListItem(person, listItemClass, isRecent ? i++ : null);
      listGroup.appendChild(listItem);
    });

  groupDiv.appendChild(listGroup);
}

function createListItem(person, listItemClass, place) {
  const listItem = document.createElement('li');
  listItem.classList.add('list-group-item');
  listItem.classList.add('list-group-item-action');
  listItem.classList.add(listItemClass);

  if (place) {
    const badge = document.createElement('span');
    badge.classList.add('badge');
    badge.classList.add('badge-pill');
    badge.classList.add('badge-light');
    badge.textContent = place;
    listItem.appendChild(badge);

    const space = document.createTextNode(" ");
    listItem.appendChild(space);
  }

  const link = document.createElement('a');
  link.href = person.URL;
  link.textContent = person.FullName;
  listItem.appendChild(link);

  if (Number.isInteger(person.DaysAgo)) {
    const timeDescription = person.DaysAgo == 0 ? " - today" : ` - ${person.DaysAgo} day${person.DaysAgo == 1 ? "" : "s"} ago`;
    const text = document.createTextNode(timeDescription);
    listItem.appendChild(text);
  }

  return listItem;
}

main();

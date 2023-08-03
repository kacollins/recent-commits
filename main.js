class Person {
  constructor(gitHubUserName, FirstName, LastName, Active, LastCommitDate) {
    this.GitHubUserName = gitHubUserName;
    this.FirstName = FirstName;
    this.LastName = LastName;
    this.Active = Active;
    this.LastCommitDate = LastCommitDate;
  }

  get FullName() {
    return `${this.FirstName} ${this.LastName}`;
  }

  get DaysAgo() {
    return this.LastCommitDate ? Math.round((new Date() - new Date(this.LastCommitDate)) / (24 * 60 * 60 * 1000)) : null;
  }

  get URL() {
    return `https://github.com/${this.GitHubUserName}`;
  }
}

async function main() {
  fetch('https://raw.githubusercontent.com/kacollins/recent-commits/json/data.json')
  .then((response) => response.json())
  .then((json) => getPeople(json));
}

function getPeople(json) {
  const people = json.people.map(person => new Person(
    person.GitHubUserName,
    person.FirstName,
    person.LastName,
    person.Active,
    person.LastCommitDate
  ));

  displayResults(people);
}

function displayResults(people) {
  var peopleToInclude = people
    .filter((u) => u.Active)
    .sort((a, b) => new Date(b.LastCommitDate) - new Date(a.LastCommitDate));

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
  header.textContent = isRecent ? '10 Most Recent Committers' : 'Everybody Else';
  groupDiv.appendChild(header);

  const listGroup = document.createElement('ul');
  listGroup.classList.add('list-group');

  var i = 1;
  const listItemClass = isRecent ? 'list-group-item-success' : 'list-group-item-info';

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

  listItem.setAttribute("data-toggle", "tooltip");
  listItem.setAttribute("data-placement", "top");
  listItem.setAttribute("title", person.LastCommitDate);

  if (place) {
    const badge = document.createElement('span');
    badge.classList.add('badge');
    badge.classList.add('rounded-pill');
    badge.classList.add('bg-success');
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
    const timeDescription = person.DaysAgo == 0 ? " - past 24 hours" : ` - ${person.DaysAgo} day${person.DaysAgo == 1 ? "" : "s"} ago`;
    const text = document.createTextNode(timeDescription);
    listItem.appendChild(text);
  }

  return listItem;
}

main();

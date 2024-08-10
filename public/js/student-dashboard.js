document.addEventListener('DOMContentLoaded', () => {
  const recentEventsList = document.getElementById('recent-events-list');
  const collegesMenu = document.getElementById('colleges');
  const collegesList = document.getElementById('colleges-list');
  const collegeListSection = document.getElementById('college-list');
  const eventsMenu = document.getElementById('events');
  const eventDetailsSection = document.getElementById('event-details');
  const eventInfo = document.getElementById('event-info');
  const upcomingEventsMenu = document.getElementById('upcoming-events');
  const eventHistoryMenu = document.getElementById('event-history');
  const recentEventsSection = document.getElementById('recent-events');

  // Fetch recent events
  fetch('/api/events')
    .then(response => response.json())
    .then(events => {
      recentEventsList.innerHTML = '';
      events.forEach(event => {
        const listItem = document.createElement('li');
        listItem.textContent = event.title;
        const registerButton = document.createElement('button');
        registerButton.textContent = 'Register';
        registerButton.addEventListener('click', () => registerForEvent(event.id));
        listItem.appendChild(registerButton);
        recentEventsList.appendChild(listItem);
      });
    });

  // Fetch colleges and display them
  collegesMenu.addEventListener('click', () => {
    collegeListSection.style.display = 'block';
    recentEventsSection.style.display = 'none';
    eventDetailsSection.style.display = 'none';

    fetch('/api/colleges')
      .then(response => response.json())
      .then(colleges => {
        collegesList.innerHTML = '';
        colleges.forEach(college => {
          const listItem = document.createElement('li');
          listItem.textContent = college.name;
          listItem.addEventListener('click', () => {
            fetch(`/api/colleges/${college.id}/events`)
              .then(response => response.json())
              .then(events => {
                eventInfo.innerHTML = '';
                events.forEach(event => {
                  const eventItem = document.createElement('div');
                  eventItem.textContent = event.title;
                  const registerButton = document.createElement('button');
                  registerButton.textContent = 'Register';
                  registerButton.addEventListener('click', () => registerForEvent(event.id));
                  eventItem.appendChild(registerButton);
                  eventInfo.appendChild(eventItem);
                });
                eventDetailsSection.style.display = 'block';
                collegeListSection.style.display = 'none';
              });
          });
          collegesList.appendChild(listItem);
        });
      });
  });

  // Fetch upcoming events
  upcomingEventsMenu.addEventListener('click', () => {
    fetch('/api/upcoming-events')
      .then(response => response.json())
      .then(events => {
        eventInfo.innerHTML = '';
        events.forEach(event => {
          const eventItem = document.createElement('div');
          eventItem.textContent = event.title;
          eventInfo.appendChild(eventItem);
        });
        eventDetailsSection.style.display = 'block';
        recentEventsSection.style.display = 'none';
        collegeListSection.style.display = 'none';
      });
  });

  // Fetch event history
  eventHistoryMenu.addEventListener('click', () => {
    fetch('/api/event-history')
      .then(response => response.json())
      .then(events => {
        eventInfo.innerHTML = '';
        events.forEach(event => {
          const eventItem = document.createElement('div');
          eventItem.textContent = event.title;
          eventInfo.appendChild(eventItem);
        });
        eventDetailsSection.style.display = 'block';
        recentEventsSection.style.display = 'none';
        collegeListSection.style.display = 'none';
      });
  });

  function registerForEvent(eventId) {
    const studentId = 'student-id'; // Replace with actual student ID from the session
    fetch(`/api/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: studentId })
    })
    .then(response => response.json())
    .then(result => {
      alert('Registered successfully');
    })
    .catch(error => {
      console.error('Error during registration:', error);
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const postEventMenu = document.getElementById('post-event');
  const eventsMenu = document.getElementById('events');
  const upcomingEventsMenu = document.getElementById('upcoming-events');
  const eventHistoryMenu = document.getElementById('event-history');
  const postEventFormSection = document.getElementById('post-event-form');
  const eventDetailsSection = document.getElementById('event-details');
  const eventInfo = document.getElementById('event-info');

  // Post an event form
  postEventMenu.addEventListener('click', () => {
    postEventFormSection.style.display = 'block';
    eventDetailsSection.style.display = 'none';
  });

  const eventForm = document.getElementById('eventForm');
  eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(eventForm);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    fetch('/api/colleges/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
      alert('Event posted successfully');
      eventForm.reset();
    })
    .catch(error => {
      console.error('Error during event posting:', error);
    });
  });

  // Fetch all events for the college
  eventsMenu.addEventListener('click', () => {
    fetch('/api/events')
      .then(response => response.json())
      .then(events => {
        eventInfo.innerHTML = '';
        events.forEach(event => {
          const eventItem = document.createElement('div');
          eventItem.textContent = event.title;
          eventItem.addEventListener('click', () => showEventDetails(event.id));
          eventInfo.appendChild(eventItem);
        });
        eventDetailsSection.style.display = 'block';
        postEventFormSection.style.display = 'none';
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
        postEventFormSection.style.display = 'none';
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
        postEventFormSection.style.display = 'none';
      });
  });

  function showEventDetails(eventId) {
    fetch(`/api/events/${eventId}`)
      .then(response => response.json())
      .then(event => {
        eventInfo.innerHTML = `
          <h3>${event.title}</h3>
          <p>${event.description}</p>
          <p>Date: ${new Date(event.date).toLocaleDateString()}</p>
          <p>Location: ${event.location}</p>
          <p>Registered Students: ${event.registeredUsers ? event.registeredUsers.length : 0}</p>
        `;
      });
  }
});

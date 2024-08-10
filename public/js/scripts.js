document.addEventListener('DOMContentLoaded', () => {
  const studentSignupForm = document.querySelector('#student-signup-form');
  const collegeSignupForm = document.querySelector('#college-signup-form');
  const studentLoginForm = document.querySelector('#student-login-form');
  const collegeLoginForm = document.querySelector('#college-login-form');

  if (studentSignupForm) {
    studentSignupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = studentSignupForm.querySelector('input[name="email"]').value;
      const password = studentSignupForm.querySelector('input[name="password"]').value;
      const name = studentSignupForm.querySelector('input[name="name"]').value;

      try {
        const response = await fetch('/student-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        
        const result = await response.json();
        
        if (response.ok) {
          alert(result.message);
          window.location.href = '/student-login';
        } else {
          alert(result.error || 'Sign up failed.');
        }
      } catch (error) {
        console.error('Error during student signup:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }

  if (collegeSignupForm) {
    collegeSignupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = collegeSignupForm.querySelector('input[name="email"]').value;
      const password = collegeSignupForm.querySelector('input[name="password"]').value;
      const collegeName = collegeSignupForm.querySelector('input[name="collegeName"]').value;

      try {
        const response = await fetch('/college-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, collegeName }),
        });
        const result = await response.json();
        if (response.ok) {
          alert(result.message);
          window.location.href = '/college-login';
        } else {
          alert(result.error || 'Sign up failed.');
        }
      } catch (error) {
        console.error('Error during college signup:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }

  if (studentLoginForm) {
    studentLoginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = studentLoginForm.querySelector('input[name="email"]').value;
      const password = studentLoginForm.querySelector('input[name="password"]').value;

      try {
        const response = await fetch('/student-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json();
        if (response.ok) {
          window.location.href = '/student-dashboard';
        } else {
          alert(result.error || 'Login failed.');
        }
      } catch (error) {
        console.error('Error during student login:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }

  if (collegeLoginForm) {
    collegeLoginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = collegeLoginForm.querySelector('input[name="email"]').value;
      const password = collegeLoginForm.querySelector('input[name="password"]').value;

      try {
        const response = await fetch('/college-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json();
        if (response.ok) {
          window.location.href = '/college-dashboard';
        } else {
          alert(result.error || 'Login failed.');
        }
      } catch (error) {
        console.error('Error during college login:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }
});

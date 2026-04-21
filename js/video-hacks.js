document.addEventListener('DOMContentLoaded', function() {
  // Handle rate button clicks
  const rateButtons = document.querySelectorAll('.rate-button');
  rateButtons.forEach(button => {
    button.addEventListener('click', function() {
      const icon = this.querySelector('i');
      icon.classList.toggle('rated');
    });
  });
});

document.addEventListener('DOMContentLoaded', function() {
  // Handle save button clicks
  const saveButtons = document.querySelectorAll('.save-button');
  saveButtons.forEach(button => {
    button.addEventListener('click', function() {
      const icon = this.querySelector('i');
      icon.classList.toggle('saved');
    });
  });
}); 
document.addEventListener('DOMContentLoaded', function() {
  // Handle rate button clicks
  const rateButtons = document.querySelectorAll('.rate-button');
  rateButtons.forEach(button => {
    button.addEventListener('click', function() {
      const icon = this.querySelector('i');
      icon.classList.toggle('rated');
    });
  });
  const containers = document.querySelectorAll('.video-hacks-container');
  const prevButton = document.querySelector('.video-prev-button');
  const nextButton = document.querySelector('.video-next-button');
  let activeIndex = 0;

  function updateNavButtons() {
    if (!prevButton || !nextButton) return;
    prevButton.disabled = activeIndex <= 0;
    nextButton.disabled = activeIndex >= containers.length - 1;
  }

  function jumpToVideo(index) {
    if (index < 0 || index >= containers.length) return;
    activeIndex = index;
    containers[activeIndex].scrollIntoView({ behavior: 'auto', block: 'start' });
    updateNavButtons();
  }

  if (prevButton) {
    prevButton.addEventListener('click', function() {
      jumpToVideo(activeIndex - 1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', function() {
      jumpToVideo(activeIndex + 1);
    });
  }

  updateNavButtons();});

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
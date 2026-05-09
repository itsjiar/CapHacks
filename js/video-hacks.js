document.addEventListener('DOMContentLoaded', function() {
  // Handle rate button clicks
  const rateButtons = document.querySelectorAll('.rate-button');
  rateButtons.forEach(button => {
    button.addEventListener('click', function() {
      const icon = this.querySelector('i');
      icon.classList.toggle('rated');
    });
  });

  // Handle save button clicks
  const saveButtons = document.querySelectorAll('.save-button');
  saveButtons.forEach(button => {
    button.addEventListener('click', function() {
      const icon = this.querySelector('i');
      icon.classList.toggle('saved');
    });
  });

  const containers = Array.from(document.querySelectorAll('.video-hacks-container'));
  const prevButton = document.querySelector('.video-prev-button');
  const nextButton = document.querySelector('.video-next-button');
  let activeIndex = 0;
  let isJumping = false;

  function updateNavButtons() {
    if (!prevButton || !nextButton) return;
    prevButton.disabled = activeIndex <= 0;
    nextButton.disabled = activeIndex >= containers.length - 1;
  }

  function jumpToVideo(index) {
    if (index < 0 || index >= containers.length || index === activeIndex) return;
    activeIndex = index;
    isJumping = true;
    containers[activeIndex].scrollIntoView({ behavior: 'auto', block: 'center' });
    updateNavButtons();
    window.setTimeout(() => { isJumping = false; }, 400);
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

  function handleWheel(event) {
    if (isJumping) return;
    event.preventDefault();
    if (event.deltaY > 0) {
      jumpToVideo(activeIndex + 1);
    } else if (event.deltaY < 0) {
      jumpToVideo(activeIndex - 1);
    }
  }

  window.addEventListener('wheel', handleWheel, { passive: false });
  updateNavButtons();
}); 
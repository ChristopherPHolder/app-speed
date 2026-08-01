document.querySelector('#reveal-result').addEventListener('click', () => {
  window.setTimeout(() => {
    const state = document.querySelector('#fixture-state');
    state.textContent = 'Interaction complete';
    state.classList.add('ready');
  }, 150);
});

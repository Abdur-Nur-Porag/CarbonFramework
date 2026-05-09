document.addEventListener('copy', (e) => {
  e.preventDefault();
  //alert("Copying content is restricted.");
});

document.addEventListener('cut', (e) => {
  e.preventDefault();
});
document.onkeydown = (e) => {
  // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
  if (
    e.keyCode === 123 ||
    (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
    (e.ctrlKey && e.keyCode === 85)
  ) {
    e.preventDefault();
    return false;
  }
};

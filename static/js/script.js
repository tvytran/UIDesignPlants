document.addEventListener('DOMContentLoaded', () => {
    const background = document.getElementById('background');
    const plant = document.getElementById('draggable-plant');
    const submitBtn = document.getElementById('submit-btn');
  
    if (!background || !plant || !submitBtn) return;
  
    let placement = null;
  
    plant.addEventListener('dragstart', e => {
      e.dataTransfer.setData('plant-id', plant.dataset.plant);
    });
  
    background.addEventListener('dragover', e => e.preventDefault());
  
    background.addEventListener('drop', e => {
      e.preventDefault();
  
      const x = e.offsetX;
      const y = e.offsetY;
  
      // Move the image visually where it was dropped
      plant.style.position = 'absolute';
      plant.style.left = x + 'px';
      plant.style.top = y + 'px';
      plant.style.zIndex = '10';
      background.appendChild(plant);
      submitBtn.disabled = false;
  
      // Determine lighting zone based on drop location (4 quadrants)
      const width = background.offsetWidth;
      const height = background.offsetHeight;
  
      let zone = '';
      if (x < width / 2 && y < height / 2) zone = 'bright-indirect';
      else if (x >= width / 2 && y < height / 2) zone = 'low-medium';
      else if (x < width / 2 && y >= height / 2) zone = 'moderate-indirect';
      else zone = 'bright-filtered';
  
      placement = {
        plant: plant.dataset.plant,
        zone: zone
      };
    });
  
    submitBtn.addEventListener('click', () => {
      if (!placement) return;
  
      fetch('/submit-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placement)
      })
      .then(res => res.json())
      .then(data => {
        window.location.href = data.next_url;
      });
    });
  });
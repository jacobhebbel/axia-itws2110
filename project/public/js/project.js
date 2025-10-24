    const openBtn = document.getElementById('openMenuBtn');
    const overlay = document.getElementById('overlay');


    const tickerValue = document.getElementById('tickerValues');
    const addBtn = document.getElementById('addBtn');
    const tickerList = document.getElementById('tickerList');

    // open the menu
    openBtn.addEventListener('click', () => {
      overlay.style.display = 'flex';
    });

    // close when clicking outside the menu
    overlay.addEventListener('click', (e) => {
        console.log('Clicked:', e.target);
      if (e.target === overlay) overlay.style.display = 'none';
    });


    addBtn.addEventListener('click', () => {
        const value = tickerValue.value.trim();
        if(value === '') return;

        const newTicker = document.createElement('div');
        newTicker.className = 'newTicker';
        newTicker.innerHTML = `
            <span>${value}</span>
            <button class = "delete">Delete</button>
        `;

        tickerList.appendChild(newTicker);

        tickerValue.value = '';
        tickerValue.focus();

        tickerValue.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') addBtn.click();
        });
    });

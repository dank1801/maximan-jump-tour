// ===========================
// STANDINGS TAB FUNCTIONALITY
// ===========================

const tabBtns = document.querySelectorAll('.tab-btn');
const standingsBody = document.getElementById('standingsBody');

const standingsData = {
    overall: [
        { rank: 1, medal: '🥇', name: 'Maxim Flugmeister', nation: '🇦🇹', points: 285, comps: 8 },
        { rank: 2, medal: '🥈', name: 'Jana Windkraft', nation: '🇩🇪', points: 268, comps: 8 },
        { rank: 3, medal: '🥉', name: 'Alpine Springer', nation: '🇨🇭', points: 251, comps: 8 },
        { rank: 4, medal: '4', name: 'Ski Master Pro', nation: '🇫🇷', points: 243, comps: 8 },
        { rank: 5, medal: '5', name: 'Peak Performer', nation: '🇮🇹', points: 238, comps: 8 },
        { rank: 6, medal: '6', name: 'Eagle Hunter', nation: '🇬🇧', points: 224, comps: 8 },
        { rank: 7, medal: '7', name: 'Nordic Spirit', nation: '🇸🇪', points: 216, comps: 8 },
        { rank: 8, medal: '8', name: 'Alpine Thunder', nation: '🇵🇱', points: 208, comps: 7 },
        { rank: 9, medal: '9', name: 'Slope Legend', nation: '🇷🇸', points: 195, comps: 7 },
        { rank: 10, medal: '10', name: 'Sky Dancer', nation: '🇳🇴', points: 182, comps: 7 }
    ],
    madzn: [
        { rank: 1, medal: '🥇', name: 'Maxim Flugmeister', nation: '🇦🇹', points: 160, comps: 6 },
        { rank: 2, medal: '🥈', name: 'Jana Windkraft', nation: '🇩🇪', points: 148, comps: 6 },
        { rank: 3, medal: '🥉', name: 'Alpine Springer', nation: '🇨🇭', points: 135, comps: 6 },
        { rank: 4, medal: '4', name: 'Peak Performer', nation: '🇮🇹', points: 128, comps: 6 },
        { rank: 5, medal: '5', name: 'Ski Master Pro', nation: '🇫🇷', points: 120, comps: 6 }
    ],
    micro: [
        { rank: 1, medal: '🥇', name: 'Jana Windkraft', nation: '🇩🇪', points: 75, comps: 3 },
        { rank: 2, medal: '🥈', name: 'Nordic Spirit', nation: '🇸🇪', points: 68, comps: 3 },
        { rank: 3, medal: '🥉', name: 'Eagle Hunter', nation: '🇬🇧', points: 61, comps: 3 },
        { rank: 4, medal: '4', name: 'Alpine Thunder', nation: '🇵🇱', points: 55, comps: 3 },
        { rank: 5, medal: '5', name: 'Maxim Flugmeister', nation: '🇦🇹', points: 50, comps: 3 }
    ],
    punki: [
        { rank: 1, medal: '🥇', name: 'Maxim Flugmeister', nation: '🇦🇹', points: 75, comps: 3 },
        { rank: 2, medal: '🥈', name: 'Alpine Springer', nation: '🇨🇭', points: 68, comps: 3 },
        { rank: 3, medal: '🥉', name: 'Peak Performer', nation: '🇮🇹', points: 55, comps: 3 },
        { rank: 4, medal: '4', name: 'Ski Master Pro', nation: '🇫🇷', points: 50, comps: 3 },
        { rank: 5, medal: '5', name: 'Sky Dancer', nation: '🇳🇴', points: 45, comps: 3 }
    ]
};

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.getAttribute('data-tab');
        const data = standingsData[tab];

        // Update table
        standingsBody.innerHTML = '';
        
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            
            // Determine medal class
            let medalClass = '';
            if (index === 0) medalClass = 'medal-gold';
            else if (index === 1) medalClass = 'medal-silver';
            else if (index === 2) medalClass = 'medal-bronze';
            
            tr.className = medalClass;
            tr.innerHTML = `
                <td class="rank"><span class="medal">${row.medal}</span></td>
                <td class="name"><strong>${row.name}</strong></td>
                <td class="nation">${row.nation}</td>
                <td class="points"><strong>${row.points}</strong></td>
                <td class="stats">${row.comps}</td>
            `;
            
            standingsBody.appendChild(tr);
            
            // Animation
            setTimeout(() => {
                tr.style.opacity = '0';
                tr.style.transform = 'translateY(10px)';
                tr.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    tr.style.opacity = '1';
                    tr.style.transform = 'translateY(0)';
                }, 10);
            }, index * 50);
        });
    });
});

console.log('Standings System Loaded! 🏆');
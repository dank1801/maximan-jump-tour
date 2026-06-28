// ===========================
// STANDINGS TAB FUNCTIONALITY
// ===========================

const tabBtns = document.querySelectorAll('.tab-btn');
const standingsBody = document.getElementById('standingsBody');

// ===========================
// FULL ATHLETE LIST (für 0‑Punkte‑Wertungen)
// ===========================

const allAthletes = [
    { name: 'Kino von Patra', nation: 'EGY', team: 'Pünki Star' },
    { name: 'Pingu Shen', nation: 'CHN', team: 'Pünki Train' },
    { name: 'Krönchen von Kråntz', nation: 'SWE', team: 'Little Fly' },
    { name: 'Fischi von Novelmore', nation: 'ISL', team: 'Fire and Ice' },
    { name: 'Jäcki Javke', nation: 'DEU', team: 'Pünki Star' },
    { name: 'Yellowly Colour', nation: 'MDG', team: 'Pünki Train' },
    { name: 'Bieni von Patra', nation: 'EGY', team: 'Girl Power' },
    { name: 'Purpla von Soldad', nation: 'FRA', team: 'Girl Power' },
    { name: 'Nulli von Burnham', nation: 'ITA', team: 'Fire and Ice' },
    { name: 'Schafo Marco-Marco', nation: 'ZMB', team: 'Little Fly' },
    { name: 'Streifjae Striffn', nation: 'MXM', team: 'WaifelWing' },
    { name: 'Pilsi von Caesar', nation: 'MXM', team: 'WaifelWing' },
    { name: 'Streifsi Striffn', nation: 'MXM', team: 'Fire and Ice' },
    { name: 'Strifñåla Striffn Dasher', nation: 'USA', team: 'WaifelWing' },
    { name: 'Pünktchen von Caesar', nation: 'MXM', team: 'Pünki Train' },
    { name: 'Iva Juranovic', nation: 'HUN', team: 'Pünki Star' },
    { name: 'Blubbi Kreischeling', nation: 'FJI', team: 'Little Fly' },
    { name: 'Lolli Sweeting', nation: 'MOZ', team: 'Fire and Ice' },
    { name: 'Pingu von Kråntz', nation: 'SWE', team: 'Pünki Train' },
    { name: 'Blümchen von Maxima', nation: 'MXM', team: 'Girl Power' },
    { name: 'Moony Caiwher', nation: 'MCO', team: 'Little Fly' },
    { name: 'Schäfchen von Schaf', nation: 'MXM', team: 'Girl Power' },
    { name: 'Pilzchen Pilz', nation: 'AUT', team: 'WaifelWing' },
    { name: 'Piljae von Caesar', nation: 'MXM', team: 'Pünki Star' },
    { name: 'Tarek Grätzli', nation: 'CHE', team: 'Pünki Star' },
    { name: 'Fischchen Fisch', nation: 'AUT', team: 'Little Fly' },
    { name: 'Cursten Black', nation: 'GBR', team: 'WaifelWing' },
    { name: 'Indi Indian', nation: 'USA', team: 'Pünki Star' },
    { name: 'Mieni von Patra', nation: 'EGY', team: 'Girl Power' },
    { name: 'Starly Starlight', nation: 'USA', team: 'Fire and Ice' },
    { name: 'Wisa von Soldad', nation: 'FRA', team: 'Girl Power' },
    { name: 'Tom Harris', nation: 'USA', team: 'Pünki Train' },
    { name: 'Baggidalido de France', nation: 'FRA', team: 'Fire and Ice' },
    { name: 'Greeni von Soldad', nation: 'FRA', team: 'WaifelWing' },
    { name: 'Nullo von Burnham', nation: 'ITA', team: 'Fire and Ice' },
    { name: 'Waifel Augustiña', nation: 'ESP', team: 'WaifelWing' },
    { name: 'Blabbo Schreieling', nation: 'FJI', team: 'Little Fly' },
    { name: 'Rangi von Soldad', nation: 'FRA', team: 'Pünki Train' }
];

// ===========================
// DATA: OVERALL + MÄDZN + 0‑PUNKTE‑SERIES
// ===========================

const standingsData = {
    overall: [
        { name: 'Kino von Patra', nation: 'EGY', team: 'Pünki Star', points: 1322, comps: 29 },
        { name: 'Pingu Shen', nation: 'CHN', team: 'Pünki Train', points: 1267, comps: 29 },
        { name: 'Krönchen von Kråntz', nation: 'SWE', team: 'Little Fly', points: 1249, comps: 29 },
        { name: 'Fischi von Novelmore', nation: 'ISL', team: 'Fire and Ice', points: 1192, comps: 29 },
        { name: 'Jäcki Javke', nation: 'DEU', team: 'Pünki Star', points: 1184, comps: 29 },
        { name: 'Yellowly Colour', nation: 'MDG', team: 'Pünki Train', points: 1032, comps: 29 },
        { name: 'Bieni von Patra', nation: 'EGY', team: 'Girl Power', points: 969, comps: 29 },
        { name: 'Purpla von Soldad', nation: 'FRA', team: 'Girl Power', points: 930, comps: 29 },
        { name: 'Nulli von Burnham', nation: 'ITA', team: 'Fire and Ice', points: 919, comps: 29 },
        { name: 'Schafo Marco-Marco', nation: 'ZMB', team: 'Little Fly', points: 892, comps: 29 },
        { name: 'Streifjae Striffn', nation: 'MXM', team: 'WaifelWing', points: 886, comps: 29 },
        { name: 'Pilsi von Caesar', nation: 'MXM', team: 'WaifelWing', points: 865, comps: 29 },
        { name: 'Streifsi Striffn', nation: 'MXM', team: 'Fire and Ice', points: 853, comps: 29 },
        { name: 'Strifñåla Striffn Dasher', nation: 'USA', team: 'WaifelWing', points: 815, comps: 29 },
        { name: 'Pünktchen von Caesar', nation: 'MXM', team: 'Pünki Train', points: 803, comps: 29 },
        { name: 'Iva Juranovic', nation: 'HUN', team: 'Pünki Star', points: 757, comps: 29 },
        { name: 'Blubbi Kreischeling', nation: 'FJI', team: 'Little Fly', points: 749, comps: 29 },
        { name: 'Lolli Sweeting', nation: 'MOZ', team: 'Fire and Ice', points: 709, comps: 29 },
        { name: 'Pingu von Kråntz', nation: 'SWE', team: 'Pünki Train', points: 664, comps: 29 },
        { name: 'Blümchen von Maxima', nation: 'MXM', team: 'Girl Power', points: 658, comps: 29 },
        { name: 'Moony Caiwher', nation: 'MCO', team: 'Little Fly', points: 578, comps: 29 },
        { name: 'Schäfchen von Schaf', nation: 'MXM', team: 'Girl Power', points: 566, comps: 29 },
        { name: 'Pilzchen Pilz', nation: 'AUT', team: 'WaifelWing', points: 551, comps: 29 },
        { name: 'Piljae von Caesar', nation: 'MXM', team: 'Pünki Star', points: 551, comps: 29 },
        { name: 'Tarek Grätzli', nation: 'CHE', team: 'Pünki Star', points: 548, comps: 29 },
        { name: 'Fischchen Fisch', nation: 'AUT', team: 'Little Fly', points: 454, comps: 29 },
        { name: 'Cursten Black', nation: 'GBR', team: 'WaifelWing', points: 429, comps: 29 },
        { name: 'Indi Indian', nation: 'USA', team: 'Pünki Star', points: 400, comps: 29 },
        { name: 'Mieni von Patra', nation: 'EGY', team: 'Girl Power', points: 379, comps: 29 },
        { name: 'Starly Starlight', nation: 'USA', team: 'Fire and Ice', points: 378, comps: 29 },
        { name: 'Wisa von Soldad', nation: 'FRA', team: 'Girl Power', points: 366, comps: 29 },
        { name: 'Tom Harris', nation: 'USA', team: 'Pünki Train', points: 355, comps: 29 },
        { name: 'Baggidalido de France', nation: 'FRA', team: 'Fire and Ice', points: 353, comps: 29 },
        { name: 'Greeni von Soldad', nation: 'FRA', team: 'WaifelWing', points: 334, comps: 29 },
        { name: 'Nullo von Burnham', nation: 'ITA', team: 'Fire and Ice', points: 270, comps: 29 },
        { name: 'Waifel Augustiña', nation: 'ESP', team: 'WaifelWing', points: 235, comps: 29 },
        { name: 'Blabbo Schreieling', nation: 'FJI', team: 'Little Fly', points: 122, comps: 29 },
        { name: 'Rangi von Soldad', nation: 'FRA', team: 'Pünki Train', points: 60, comps: 29 }
    ],

    madzn: [
        { name: 'Iva Juranovic', nation: 'HUN', team: 'Pünki Star', points: 849.3, comps: 4 },
        { name: 'Pünktchen von Caesar', nation: 'MXM', team: 'Pünki Train', points: 799.7, comps: 4 },
        { name: 'Bieni von Patra', nation: 'EGY', team: 'Girl Power', points: 786.6, comps: 4 },
        { name: 'Schafo Marco-Marco', nation: 'ZMB', team: 'Little Fly', points: 760.4, comps: 4 },
        { name: 'Moony Caiwher', nation: 'MCO', team: 'Little Fly', points: 759.7, comps: 4 },
        { name: 'Pingu Shen', nation: 'CHN', team: 'Pünki Train', points: 669.6, comps: 4 },
        { name: 'Strifñåla Striffn-Dasher', nation: 'USA', team: 'WaifelWing', points: 658.7, comps: 4 },
        { name: 'Tarek Grätzli', nation: 'CHE', team: 'Pünki Star', points: 653.3, comps: 4 },
        { name: 'Lolli Sweeting', nation: 'MOZ', team: 'Fire and Ice', points: 583.3, comps: 4 },
        { name: 'Kino von Patra', nation: 'EGY', team: 'Pünki Star', points: 575.8, comps: 4 },
        { name: 'Blümchen von Maxima', nation: 'MXM', team: 'Girl Power', points: 569.8, comps: 4 },
        { name: 'Yellowly Colour', nation: 'MDG', team: 'Pünki Train', points: 531.8, comps: 4 },
        { name: 'Pingu von Kråntz', nation: 'SWE', team: 'Pünki Train', points: 523.4, comps: 4 },
        { name: 'Fischi von Novelmore', nation: 'ISL', team: 'Fire and Ice', points: 514.5, comps: 4 },
        { name: 'Krönchen von Kråntz', nation: 'SWE', team: 'Little Fly', points: 487.7, comps: 4 },
        { name: 'Blubbi Kreischeling', nation: 'FJI', team: 'Little Fly', points: 450.9, comps: 4 },
        { name: 'Pilzchen Pilz', nation: 'AUT', team: 'WaifelWing', points: 441.4, comps: 4 },
        { name: 'Streifsi Striffn', nation: 'MXM', team: 'Fire and Ice', points: 373, comps: 4 },
        { name: 'Pilsi von Caesar', nation: 'MXM', team: 'WaifelWing', points: 370.5, comps: 4 },
        { name: 'Streifjae Striffn', nation: 'MXM', team: 'WaifelWing', points: 363.1, comps: 4 },
        { name: 'Jäcki Javke', nation: 'DEU', team: 'Pünki Star', points: 304.4, comps: 4 },
        { name: 'Purpla von Soldad', nation: 'FRA', team: 'Girl Power', points: 297.2, comps: 4 },
        { name: 'Nulli von Burnham', nation: 'ITA', team: 'Fire and Ice', points: 256.1, comps: 4 },
        { name: 'Schäfchen von Schaf', nation: 'MXM', team: 'Girl Power', points: 202.7, comps: 4 }
    ],

    micro: allAthletes.map(a => ({ ...a, points: 0, comps: 0 })),
    punki: allAthletes.map(a => ({ ...a, points: 0, comps: 0 }))
};

// ===========================
// Sortieren + Rank hinzufügen
// ===========================

for (const key in standingsData) {
    standingsData[key].sort((a, b) => b.points - a.points);
    standingsData[key].forEach((athlete, index) => {
        athlete.rank = index + 1;
    });
}

// ===========================
// TAB SWITCHING + TABLE RENDER
// ===========================

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {

        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.getAttribute('data-tab');
        const data = standingsData[tab];

        standingsBody.innerHTML = '';

        data.forEach((row, index) => {
            const tr = document.createElement('tr');

            let medalClass = '';
            let medalSymbol = row.rank;
            
            if (index === 0) medalClass = 'medal-gold';
            if (index === 1) medalClass = 'medal-silver';
            if (index === 2) medalClass = 'medal-bronze';

            tr.className = medalClass;

            tr.innerHTML = `
                <td class="rank"><span class="medal">${medalSymbol}</span></td>
                <td class="name"><strong>${row.name}</strong></td>
                <td class="nation">${row.nation}</td>
                <td class="team">${row.team}</td>
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

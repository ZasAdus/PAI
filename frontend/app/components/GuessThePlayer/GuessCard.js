"use client";

// Hardcoded competition logos (Transfermarkt CDN)
const COMPETITION_LOGOS = {
  GB1: { name: 'Premier League',  url: 'https://tmssl.akamaized.net/images/logo/normal/gb1.png' },
  ES1: { name: 'La Liga',         url: 'https://tmssl.akamaized.net/images/logo/normal/es1.png' },
  IT1: { name: 'Serie A',         url: 'https://tmssl.akamaized.net/images/logo/normal/it1.png' },
  L1:  { name: 'Bundesliga',      url: 'https://tmssl.akamaized.net/images/logo/normal/l1.png'  },
  FR1: { name: 'Ligue 1',         url: 'https://tmssl.akamaized.net/images/logo/normal/fr1.png' },
};

const COUNTRY_ISO = {
  'afghanistan':'af','albania':'al','algeria':'dz','andorra':'ad','angola':'ao',
  'argentina':'ar','armenia':'am','australia':'au','austria':'at','azerbaijan':'az',
  'bahrain':'bh','belarus':'by','belgium':'be','benin':'bj','bolivia':'bo',
  'bosnia and herzegovina':'ba','brazil':'br','bulgaria':'bg','burkina faso':'bf',
  'cameroon':'cm','canada':'ca','cabo verde':'cv','chile':'cl','china':'cn',
  'colombia':'co','congo':'cg','costa rica':'cr','croatia':'hr','cuba':'cu',
  'curacao':'cw','czechia':'cz','czech republic':'cz',
  'democratic republic of the congo':'cd','denmark':'dk','dr congo':'cd',
  'ecuador':'ec','egypt':'eg','ethiopia':'et','finland':'fi','france':'fr',
  'gabon':'ga','gambia':'gm','georgia':'ge','germany':'de','ghana':'gh',
  'greece':'gr','guatemala':'gt','guinea':'gn','guinea-bissau':'gw',
  'honduras':'hn','hungary':'hu','iceland':'is','india':'in','indonesia':'id',
  'iran':'ir','iraq':'iq','ireland':'ie','republic of ireland':'ie','israel':'il',
  'italy':'it','ivory coast':'ci','jamaica':'jm','japan':'jp','jordan':'jo',
  'kazakhstan':'kz','kenya':'ke','latvia':'lv','lebanon':'lb','liberia':'lr',
  'libya':'ly','liechtenstein':'li','lithuania':'lt','luxembourg':'lu',
  'madagascar':'mg','mali':'ml','malta':'mt','mauritania':'mr','mauritius':'mu',
  'mexico':'mx','moldova':'md','monaco':'mc','montenegro':'me','morocco':'ma',
  'mozambique':'mz','namibia':'na','netherlands':'nl','new zealand':'nz',
  'nicaragua':'ni','niger':'ne','nigeria':'ng','north korea':'kp',
  'north macedonia':'mk','norway':'no','oman':'om','panama':'pa','paraguay':'py',
  'peru':'pe','philippines':'ph','poland':'pl','portugal':'pt','qatar':'qa',
  'romania':'ro','russia':'ru','saudi arabia':'sa','senegal':'sn','serbia':'rs',
  'sierra leone':'sl','slovakia':'sk','slovenia':'si','south africa':'za',
  'south korea':'kr','spain':'es','sudan':'sd','sweden':'se','switzerland':'ch',
  'syria':'sy','tanzania':'tz','thailand':'th','togo':'tg',
  'trinidad and tobago':'tt','tunisia':'tn','turkey':'tr','turkiye':'tr',
  'uganda':'ug','ukraine':'ua','united arab emirates':'ae','united states':'us',
  'usa':'us','uruguay':'uy','uzbekistan':'uz','venezuela':'ve','vietnam':'vn',
  'zambia':'zm','zimbabwe':'zw',
};

const HARDCODED_FLAGS = {
  'england':          'https://upload.wikimedia.org/wikipedia/en/b/be/Flag_of_England.svg',
  'scotland':         'https://upload.wikimedia.org/wikipedia/commons/1/10/Flag_of_Scotland.svg',
  'wales':            'https://upload.wikimedia.org/wikipedia/commons/d/dc/Flag_of_Wales.svg',
  'northern ireland': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Flag_of_Northern_Ireland_%281953%E2%80%931972%29.svg',
  'kosovo':           'https://upload.wikimedia.org/wikipedia/commons/1/1f/Flag_of_Kosovo.svg',
};

function getFlagUrl(country) {
  if (!country) return null;
  const key = country.trim().toLowerCase();
  if (HARDCODED_FLAGS[key]) return HARDCODED_FLAGS[key];
  const iso = COUNTRY_ISO[key];
  return iso ? `https://flagcdn.com/w40/${iso}.png` : null;
}

function getClubLogoUrl(clubId) {
  if (!clubId) return null;
  return `https://tmssl.akamaized.net/images/wappen/normquad/${clubId}.png`;
}

const ICON_KEYS = new Set(['club', 'league', 'country']);

function HintIcon({ itemKey, guess }) {
  if (itemKey === 'club') {
    const logo = getClubLogoUrl(guess?.current_club_id);
    if (logo) return <img src={logo} alt={guess?.current_club_name || ''} className="hint-icon hint-icon-club" onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'inline'); }} />;
  }
  if (itemKey === 'league') {
    const comp = COMPETITION_LOGOS[guess?.competition_id];
    if (comp) return <img src={comp.url} alt={comp.name} className="hint-icon hint-icon-league" onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'inline'); }} />;
  }
  if (itemKey === 'country') {
    const flagUrl = getFlagUrl(guess?.country_of_birth);
    if (flagUrl) return <img src={flagUrl} alt={guess?.country_of_birth || ''} className="hint-icon hint-icon-flag" onError={e => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'inline'); }} />;
  }
  return null;
}

export default function GuessCard({ attempt }) {
  const { guess, comparisons, attempt_number } = attempt;

  return (
    <div className="panel guess-card">
      <div className="guess-layout">
        <div className="guess-player-info">
          <div className="guess-avatar-container">
            {guess.player_image_url ? (
              <img src={guess.player_image_url} alt={guess.player_name} className="guess-avatar-large" />
            ) : (
              <div className="guess-avatar-placeholder">?</div>
            )}
          </div>
          <div className="guess-player-meta">
            <span className="guess-number">#{attempt_number}</span>
            <div className="guess-name">{guess.player_name}</div>
          </div>
        </div>

        <div className="guess-grid-container">
          <div className="guess-grid">
            {comparisons.map((item) => (
              <div key={item.key} className="hint-box">
                <span className="hint-label">{item.label}</span>
                <div className={`hint-value ${item.status}${ICON_KEYS.has(item.key) ? ' hint-value--icon' : ''}`}>
                  {item.direction === 'up' && <span className="arrow">↑</span>}
                  {item.direction === 'down' && <span className="arrow">↓</span>}
                  {item.match && <span className="arrow">✓</span>}
                  <HintIcon itemKey={item.key} guess={guess} />
                  {ICON_KEYS.has(item.key)
                    ? <span className="value-text" style={{ display: 'none' }}>{item.guess || '?'}</span>
                    : <span className="value-text">{item.guess || '?'}</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
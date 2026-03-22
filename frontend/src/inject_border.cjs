const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');

const pagesWithBorder = [
    'CropRecommendation.jsx',
    'DiseaseDetection.jsx',
    'MarketPrices.jsx',
    'MarketAnalytics.jsx',
    'Chatbot.jsx',
    'GovernmentSchemes.jsx',
    'WeatherPage.jsx'
];

pagesWithBorder.forEach(file => {
    const filePath = path.join(pagesDir, file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Fix #FF0000 -> #22C55E
    content = content.replace(/#FF0000/gi, '#22C55E');
    // Also #1A0A0A -> #020D05
    content = content.replace(/#1A0A0A/gi, '#020D05');
    
    // 2. Inject VineBorder import if not present
    if (!content.includes('VineBorder')) {
        content = content.replace(
            "import { useState", 
            "import VineBorder from '../components/VineBorder'\nimport { useState"
        );
        // If it still doesn't have it (no standard import useState)
        if (!content.includes('VineBorder')) {
            content = content.replace(
                "import React", 
                "import React\nimport VineBorder from '../components/VineBorder'"
            );
        }
    }
    
    // 3. Inject <VineBorder /> below header
    // Specific replacements for known headers
    
    if (file === 'DiseaseDetection.jsx') {
        content = content.replace(
            "borderBottom:'1px solid #22C55E33' }}>\n        <p",
            "paddingBottom:0 }}>\n        <p"
        );
        content = content.replace(
            "{t('dis_nge.subtitle')}\n        </p>\n      </div>",
            "{t('dis_nge.subtitle')}\n        </p>\n      </div>\n      <VineBorder />"
        );
    }
    else if (file === 'CropRecommendation.jsx') {
        content = content.replace(
            "paddingBottom:16, borderBottom:'1px solid #22C55E22' }}>",
            "paddingBottom:0 }}>"
        );
        content = content.replace(
            "               )}Theme: {isActive ? '#22C55E' : isDone ? '#00FF4188' : '#333'}", // Wait, just replace the closing div
            "" // better to use regex
        );
        // To be safe, just regex the first `</div>` after the header breadcrumb
        content = content.replace(
            "        </div>\n      </div>\n\n      {/* Main content */}",
            "        </div>\n      </div>\n      <VineBorder />\n\n      {/* Main content */}"
        );
    }
    else if (file === 'Chatbot.jsx') {
         content = content.replace(
            "borderBottom: '1px solid #22C55E',\n        display:",
            "display:"
         );
         content = content.replace(
            "// ECO SYSTEM ONLINE\n          </span>\n        </div>\n      </div>",
            "// ECO SYSTEM ONLINE\n          </span>\n        </div>\n      </div>\n      <VineBorder />"
         );
    }
    else if (file === 'GovernmentSchemes.jsx') {
        content = content.replace(
            "paddingBottom:16, borderBottom:'1px solid #22C55E33' }}>",
            "paddingBottom:0 }}>"
        );
        content = content.replace(
            "</div>\n\n      {/* Search & Filters */}",
            "</div>\n      <VineBorder />\n\n      {/* Search & Filters */}"
        );
    }
    else if (file === 'MarketPrices.jsx') {
        // MarketPrices has borderBottom: '1px solid #22C55E44' on the header
        content = content.replace(
            "borderBottom: '1px solid #22C55E44', background: '#040F07' }}>",
            "background: '#040F07' }}>"
        );
        content = content.replace(
            "{t('dash_nge.market_sub') || '// MARKET INTELLIGENCE SYSTEM'}\n          </p>\n        </div>\n      </div>",
            "{t('dash_nge.market_sub') || '// MARKET INTELLIGENCE SYSTEM'}\n          </p>\n        </div>\n      </div>\n      <VineBorder />"
        );
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Processed", file);
});

const fs = require('fs')

const fixFile = (file, replacements) => {
  let text = fs.readFileSync(file, 'utf8')
  let orig = text
  
  if (!text.includes("import { useTheme }")) {
    text = text.replace("import api from '../api/axios'", "import api from '../api/axios'\nimport { useTheme } from '../contexts/ThemeContext'")
    text = text.replace("import {\n  LineChart", "import { useTheme } from '../contexts/ThemeContext'\nimport {\n  LineChart")
    
    text = text.replace("const { t } = useTranslation()", "const { t } = useTranslation()\n  const { currentTheme: themeVars } = useTheme()")
  }

  replacements.forEach(r => {
    text = text.replace(r.p, r.r)
  })

  if (text !== orig) {
    fs.writeFileSync(file, text)
    console.log("Updated", file)
  }
}

fixFile('src/pages/WeatherPage.jsx', [
  {p: /stroke="var\(--primary-dim\)"/g, r: "stroke={themeVars.primaryDim}"},
  {p: /cursor=\{\{fill: 'var\(--primary-glow\)'\}\}/g, r: "cursor={{fill: themeVars.primaryGlow}}"},
  {p: /fill='var\(--primary\)'/g, r: "fill={themeVars.primary}"}
])

fixFile('src/pages/MarketPrices.jsx', [
  {p: /stroke="var\(--primary-dim\)"/g, r: "stroke={themeVars.primaryDim}"},
  {p: /cursor=\{\{ stroke: 'var\(--primary-glow\)', strokeWidth: 20 \}\}/g, r: "cursor={{ stroke: themeVars.primaryGlow, strokeWidth: 20 }}"}
])

fixFile('src/pages/MarketAnalytics.jsx', [
  {p: /const COLORS = \["#00FF41", "#A3E635", 'var\(--primary\)', "var\(--primary\)", 'var\(--tertiary\)', "#E8E8E8"\]/g, r: "const getColors = (t) => [\"#00FF41\", \"#A3E635\", t.primary, t.primary, t.tertiary, \"#E8E8E8\"]"},
  {p: /const \[selectedCrops, setSelectedCrops\] = useState\(\["rice","tomato"\]\)/g, r: "const [selectedCrops, setSelectedCrops] = useState([\"rice\",\"tomato\"])\n  const COLORS = getColors(themeVars)"},
  {p: /stroke="var\(--primary-dim\)"/g, r: "stroke={themeVars.primaryDim}"},
  {p: /cursor=\{\{ stroke: 'var\(--primary-glow\)', strokeWidth: 20 \}\}/g, r: "cursor={{ stroke: themeVars.primaryGlow, strokeWidth: 20 }}"}
])

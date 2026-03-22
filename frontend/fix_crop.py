import re

file_path = r"c:\Users\archi\OneDrive\Desktop\AI PROJECT\croprecomd ver3\frontend\src\pages\CropRecommendation.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

correct_func = """  // Step 2 — district selected → fetch + predict
  const handleDistrictSelect = useCallback(async (districtName) => {
    setSelectedDist(districtName)
    setStep('loading')
    setError(null)
    setLoadPhase(0)

    try {
      // Phase 1 — locate
      setLoadPhase(0)
      await new Promise(r => setTimeout(r, 500))

      // Phase 2 — weather for specific district/city
      setLoadPhase(1)
      let weatherData
      try {
        const wRes = await api.get(
          `/api/weather/${encodeURIComponent(districtName)}`
        )
        weatherData = {
          temperature: wRes.data.current?.temp       || wRes.data.temperature,
          humidity:    wRes.data.current?.humidity   || wRes.data.humidity,
          rainfall:    wRes.data.current?.rainfall   || wRes.data.rainfall || 80,
          description: wRes.data.current?.description|| 'Partly Cloudy',
          city:        districtName
        }
      } catch {
        // Region-based mock weather
        const baseSoil = SOIL_DATA[selectedState] || {}
        const zone     = DISTRICT_ZONES[districtName] || baseSoil.region || 'central'
        const regionWeather = {
          arid:         { temperature:36, humidity:22, rainfall:28  },
          western:      { temperature:31, humidity:52, rainfall:68  },
          gangetic:     { temperature:27, humidity:72, rainfall:115 },
          southern:     { temperature:29, humidity:74, rainfall:135 },
          coastal:      { temperature:28, humidity:82, rainfall:195 },
          eastern:      { temperature:27, humidity:78, rainfall:165 },
          northeastern: { temperature:22, humidity:88, rainfall:235 },
          himalayan:    { temperature:12, humidity:62, rainfall:145 },
          central:      { temperature:30, humidity:56, rainfall:88  },
          default:      { temperature:28, humidity:65, rainfall:100 },
        }
        weatherData = {
          ...(regionWeather[zone] || regionWeather.central),
          description: 'Partly Cloudy',
          city: districtName
        }
      }
      setWeather(weatherData)
      await new Promise(r => setTimeout(r, 400))

      // Phase 3 — district-adjusted soil
      setLoadPhase(2)
      const soilData = getDistrictSoil(selectedState, districtName)
      setSoil(soilData)
      await new Promise(r => setTimeout(r, 400))

      // Phase 4 — apply modifiers
      setLoadPhase(3)
      await new Promise(r => setTimeout(r, 300))

      // Phase 5 — ML prediction
      setLoadPhase(4)
      const predRes = await api.post('/api/predict-crop', {
        nitrogen:    soilData.N,
        phosphorus:  soilData.P,
        potassium:   soilData.K,
        temperature: weatherData.temperature,
        humidity:    weatherData.humidity,
        ph:          soilData.ph,
        rainfall:    weatherData.rainfall,
      })

      // Phase 6 — done
      setLoadPhase(5)
      await new Promise(r => setTimeout(r, 300))

      setResult(predRes.data)
      setStep('result')

      setHistory(prev => [{
        state:    selectedState,
        district: districtName,
        crop:     predRes.data.recommended_crop,
        conf:     predRes.data.confidence,
        time:     new Date().toLocaleTimeString('en-IN')
      }, ...prev].slice(0, 6))

    } catch (err) {
      setError(`Analysis failed for ${districtName}. Check backend.`)
      setStep('district')
    }
  }, [selectedState, getDistrictSoil])"""

# Because the fuzzy matcher destroyed lines 105 to 130 roughly, I will regex replace from comment "// Step 2" down to "}, [selectedState, getDistrictSoil])"

content = re.sub(
    r'  // Step 2 — district selected → fetch \+ predict\n  const handleDistrictSelect = useCallback\(async \(districtName\) => \{.*?  \}, \[selectedState, getDistrictSoil\]\)',
    correct_func,
    content,
    flags=re.DOTALL
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("done")

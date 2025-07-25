// Soil type recommendations
const soilRecommendations = {
  'Alluvial Soil': {
    description: 'Rich in nutrients and highly fertile soil formed by river deposits, common in Tamil Nadu delta regions.',
    suitableCrops: [
      'Paddy (நெல்)',
      'Sugarcane (கரும்பு)',
      'Banana (வாழைப்பழம்)',
      'Coconut (தென்னை)',
      'Betel (வெற்றிலை)'
    ],
    improvements: [
      'Regular organic matter addition to maintain fertility',
      'Good drainage system to prevent waterlogging',
      'Crop rotation to maintain soil health'
    ],
    characteristics: [
      'Good water retention capacity',
      'High mineral content',
      'Medium to fine texture'
    ]
  },
  'Black Soil': {
    description: 'Deep black soil rich in clay content and moisture retention capacity, found in parts of western Tamil Nadu.',
    suitableCrops: [
      'Cotton (பருத்தி)',
      'Chilli (மிளகாய்)',
      'Groundnut (நிலக்கடலை)',
      'Sorghum (சோளம்)',
      'Green Gram (பச்சைப்பயிறு)'
    ],
    improvements: [
      'Deep ploughing to improve aeration',
      'Addition of organic matter to improve structure',
      'Proper drainage during monsoon'
    ],
    characteristics: [
      'High water retention',
      'Rich in calcium, magnesium, and potash',
      'Self-ploughing nature'
    ]
  },
  'Clay Soil': {
    description: 'Heavy soil with high water retention and slow drainage, common in lowland areas of Tamil Nadu.',
    suitableCrops: [
      'Paddy (நெல்)',
      'Turmeric (மஞ்சள்)',
      'Water Spinach (வள்ளிக்கீரை)',
      'Taro (சேப்பங்கிழங்கு)',
      'Tapioca (மரவள்ளி)'
    ],
    improvements: [
      'Add organic matter to improve structure',
      'Install drainage systems',
      'Deep tilling when dry'
    ],
    characteristics: [
      'High nutrient content',
      'Poor drainage',
      'Compacts easily'
    ]
  },
  'Red Soil': {
    description: 'Well-drained soil rich in iron oxides with moderate fertility, predominant in many parts of Tamil Nadu.',
    suitableCrops: [
      'Finger Millet (கேழ்வரகு)',
      'Groundnut (நிலக்கடலை)',
      'Horse Gram (கொள்ளு)',
      'Pearl Millet (கம்பு)',
      'Black Gram (உளுந்து)'
    ],
    improvements: [
      'Regular addition of organic matter',
      'Mulching to prevent water loss',
      'Balanced fertilization'
    ],
    characteristics: [
      'Good drainage',
      'Low nitrogen and phosphorus',
      'Responsive to irrigation'
    ]
  }
};

// Disease recommendations
const diseaseRecommendations = {
  'curl': {
    description: 'Leaf curl disease affecting plant growth and yield.',
    causes: [
      'Viral infection',
      'Transmitted by whiteflies',
      'Environmental stress'
    ],
    treatment: [
      'Remove and destroy infected plants',
      'Control whitefly population',
      'Use disease-resistant varieties'
    ],
    prevention: [
      'Regular monitoring for early detection',
      'Maintain proper plant spacing',
      'Use yellow sticky traps for whiteflies'
    ]
  },
  'healthy': {
    description: 'Plant showing normal growth patterns without disease symptoms.',
    maintenance: [
      'Regular watering schedule',
      'Balanced fertilization',
      'Proper sunlight exposure'
    ],
    prevention: [
      'Monitor for early signs of disease',
      'Maintain good air circulation',
      'Practice crop rotation'
    ]
  },
  'slug': {
    description: 'Damage caused by slugs feeding on plant tissue.',
    causes: [
      'High moisture conditions',
      'Dense plant coverage',
      'Organic debris accumulation'
    ],
    treatment: [
      'Use slug baits or traps',
      'Create barriers around plants',
      'Remove hiding places near plants'
    ],
    prevention: [
      'Maintain dry soil surface',
      'Regular garden cleanup',
      'Encourage natural predators'
    ]
  },
  'spot': {
    description: 'Fungal disease causing spots on leaves and stems.',
    causes: [
      'Fungal pathogens',
      'High humidity',
      'Poor air circulation'
    ],
    treatment: [
      'Remove infected leaves',
      'Apply appropriate fungicide',
      'Improve air circulation'
    ],
    prevention: [
      'Avoid overhead watering',
      'Space plants properly',
      'Use disease-resistant varieties'
    ]
  }
};

export function getSoilRecommendations(soilType) {
  return soilRecommendations[soilType] || null;
}

export function getDiseaseRecommendations(diseaseStatus) {
  return diseaseRecommendations[diseaseStatus] || null;
}
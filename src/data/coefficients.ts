// Automatically generated from km-calculator-coefficients.json

export const CALCULATOR_COEFFICIENTS = {
  "_meta": {
    "description": "Коэффициенты калькулятора стоимости проектных работ КМ (конструкции металлические)",
    "version": "R2.0.1",
    "base_price_rub": 80000,
    "currency": "RUB",
    "systems": [
      "Спринт-М",
      "Спринт-2М",
      "Великан",
      "Атлант",
      "Атлант-М",
      "Крон"
    ]
  },
  "systems": {
    "Спринт-М": {
      "base_coef": {
        "two_slope": 1.0,
        "one_slope": 1.05
      },
      "span": {
        "two_slope": [
          {
            "max": 12,
            "coef": 0.0
          },
          {
            "max": 15,
            "coef": 0.15
          },
          {
            "max": 18,
            "coef": 0.25
          },
          {
            "max": 21,
            "coef": 0.35
          },
          {
            "max": 24,
            "coef": 0.5
          }
        ],
        "one_slope": [
          {
            "max": 6,
            "coef": 0.0
          },
          {
            "max": 7.5,
            "coef": 0.05
          },
          {
            "max": 9,
            "coef": 0.1
          },
          {
            "max": 10.5,
            "coef": 0.2
          },
          {
            "max": 12,
            "coef": 0.25
          }
        ]
      },
      "height": {
        "two_slope": [
          {
            "max": 6,
            "coef": 0.0
          },
          {
            "max": 8,
            "coef": 0.15
          },
          {
            "above": 8,
            "coef": 0.6
          }
        ],
        "one_slope": [
          {
            "max": 5,
            "coef": 0.0
          },
          {
            "max": 6,
            "coef": 0.15
          },
          {
            "above": 6,
            "coef": 0.45
          }
        ]
      },
      "metal_consumption_kg_m2": 25,
      "notes": {
        "two_slope": "базовая стоимость 80 000 руб",
        "one_slope": "отсутствие затяжки -0.2, сборка без плагина рамы +0.1, разные вертикальные связи +0.15"
      }
    },
    "Спринт-2М": {
      "base_coef": {
        "two_slope": 1.2,
        "one_slope": 1.2
      },
      "span": {
        "two_slope": [
          {
            "max": 12,
            "coef": 0.0
          },
          {
            "max": 15,
            "coef": 0.25
          },
          {
            "max": 18,
            "coef": 0.4
          },
          {
            "max": 21,
            "coef": 0.55
          },
          {
            "max": 24,
            "coef": 0.7
          }
        ],
        "one_slope": [
          {
            "max": 6,
            "coef": 0.0
          },
          {
            "max": 7.5,
            "coef": 0.05
          },
          {
            "max": 9,
            "coef": 0.15
          },
          {
            "max": 10.5,
            "coef": 0.3
          },
          {
            "max": 12,
            "coef": 0.4
          }
        ]
      },
      "height": {
        "two_slope": [
          {
            "max": 5,
            "coef": 0.0
          },
          {
            "max": 8,
            "coef": 0.15
          },
          {
            "above": 8,
            "coef": 0.6
          }
        ],
        "one_slope": [
          {
            "max": 5,
            "coef": 0.0
          },
          {
            "max": 7,
            "coef": 0.15
          },
          {
            "above": 7,
            "coef": 0.45
          }
        ]
      },
      "metal_consumption_kg_m2": 30,
      "notes": "+ шпренгельная затяжка +0.15"
    },
    "Крон": {
      "base_coef": {
        "two_slope": 1.3,
        "one_slope": 1.6
      },
      "span": {
        "two_slope": [
          {
            "max": 12,
            "coef": 0.0
          },
          {
            "max": 18,
            "coef": 0.4
          },
          {
            "max": 21,
            "coef": 0.8
          },
          {
            "max": 24,
            "coef": 1.2
          },
          {
            "max": 30,
            "coef": 1.6
          }
        ],
        "one_slope": [
          {
            "max": 8,
            "coef": 0.0
          },
          {
            "max": 12,
            "coef": 0.5
          },
          {
            "max": 18,
            "coef": 1.0
          },
          {
            "max": 24,
            "coef": 1.5
          },
          {
            "max": 30,
            "coef": 2.0
          }
        ]
      },
      "height": {
        "two_slope": [
          {
            "max": 5,
            "coef": 0.0
          },
          {
            "max": 7,
            "coef": 0.15
          },
          {
            "above": 7,
            "coef": 0.6
          }
        ],
        "one_slope": [
          {
            "max": 6,
            "coef": 0.0
          },
          {
            "max": 8,
            "coef": 0.15
          },
          {
            "above": 8,
            "coef": 0.6
          }
        ]
      },
      "metal_consumption_kg_m2": 30,
      "notes": {
        "two_slope": "сборка без планина рамы +0.8",
        "one_slope": "сборка без планина рамы +0.8 + разные вертикальные связи +0.25"
      }
    },
    "Великан": {
      "base_coef": {
        "two_slope": 1.8,
        "one_slope": 2.0,
        "flat": 1.8,
        "multi_slope": 1.8
      },
      "span": {
        "two_slope": [
          {
            "max": 12,
            "coef": 0.0,
            "new_span_coef": 1.05
          },
          {
            "max": 18,
            "coef": 0.5,
            "new_span_coef": 1.05
          },
          {
            "max": 24,
            "coef": 1.0,
            "new_span_coef": 0.8
          },
          {
            "max": 30,
            "coef": 1.75,
            "new_span_coef": 0.8
          },
          {
            "max": 36,
            "coef": 3.0,
            "new_span_coef": 0.55
          },
          {
            "above": 36,
            "coef": 1.5,
            "new_span_coef": 0.15,
            "step": 6
          }
        ],
        "one_slope": [
          {
            "max": 12,
            "coef": 0.0,
            "new_span_coef": 0.65
          },
          {
            "max": 18,
            "coef": 0.4,
            "new_span_coef": 1.0
          },
          {
            "max": 24,
            "coef": 0.8,
            "new_span_coef": 0.5
          },
          {
            "max": 30,
            "coef": 1.5,
            "new_span_coef": 0.5
          },
          {
            "max": 36,
            "coef": 2.5,
            "new_span_coef": 0.35
          },
          {
            "above": 36,
            "coef": 1.0,
            "new_span_coef": 0.0,
            "step": 6
          }
        ]
      },
      "height": {
        "two_slope": [
          {
            "max": 6,
            "coef": 0.0
          },
          {
            "max": 7,
            "coef": 0.25
          },
          {
            "max": 9,
            "coef": 0.5
          },
          {
            "max": 12,
            "coef": 1.0
          },
          {
            "above": 12,
            "coef": 0.75,
            "step": 3
          }
        ],
        "one_slope": [
          {
            "max": 4,
            "coef": 0.0
          },
          {
            "max": 6,
            "coef": 0.3
          },
          {
            "max": 9,
            "coef": 0.8
          },
          {
            "max": 12,
            "coef": 1.3
          },
          {
            "above": 12,
            "coef": 0.75,
            "step": 3
          }
        ],
        "flat": [
          {
            "max": 6,
            "coef": 0.0
          },
          {
            "max": 7,
            "coef": 0.25
          },
          {
            "max": 9,
            "coef": 0.5
          },
          {
            "max": 12,
            "coef": 1.0
          },
          {
            "above": 12,
            "coef": 0.75,
            "step": 3
          }
        ],
        "multi_slope": [
          {
            "max": 6,
            "coef": 0.0
          },
          {
            "max": 7,
            "coef": 0.25
          },
          {
            "max": 9,
            "coef": 0.5
          },
          {
            "max": 12,
            "coef": 1.0
          },
          {
            "above": 12,
            "coef": 0.75,
            "step": 3
          }
        ]
      },
      "multi_span": {
        "two_slope": {
          "first_span": 1.8,
          "additional_span": 0.4
        },
        "one_slope": {
          "first_span": 2.0,
          "additional_span": 0.6
        },
        "flat": {
          "first_span": 1.8,
          "additional_span": 0.3
        },
        "multi_slope": {
          "first_span": 1.8,
          "additional_span": 0.4
        }
      },
      "metal_consumption_kg_m2": 35,
      "crane": {
        "support_single_span": 0.75,
        "support_per_span": 0.6,
        "support_diff_capacity": 0.2,
        "suspension_single_span": 0.6,
        "suspension_per_span": 0.5,
        "suspension_diff_capacity": 0.2
      }
    },
    "Атлант": {
      "base_coef": {
        "two_slope": 1.6,
        "one_slope": 1.8,
        "flat": 1.6,
        "multi_slope": 1.6
      },
      "span": {
        "two_slope": [
          {
            "max": 12,
            "coef": 0.0,
            "new_span_coef": 0.65
          },
          {
            "max": 18,
            "coef": 0.4,
            "new_span_coef": 1.0
          },
          {
            "max": 24,
            "coef": 0.8,
            "new_span_coef": 0.5
          },
          {
            "max": 30,
            "coef": 1.5,
            "new_span_coef": 0.5
          },
          {
            "max": 36,
            "coef": 2.5,
            "new_span_coef": 0.35
          },
          {
            "above": 36,
            "coef": 1.0,
            "new_span_coef": 0.0,
            "step": 6
          }
        ],
        "one_slope": [
          {
            "max": 12,
            "coef": 0.0,
            "new_span_coef": 0.65
          },
          {
            "max": 18,
            "coef": 0.4,
            "new_span_coef": 1.0
          },
          {
            "max": 24,
            "coef": 0.8,
            "new_span_coef": 0.5
          },
          {
            "max": 30,
            "coef": 1.5,
            "new_span_coef": 0.5
          },
          {
            "max": 36,
            "coef": 2.5,
            "new_span_coef": 0.35
          },
          {
            "above": 36,
            "coef": 1.0,
            "new_span_coef": 0.0,
            "step": 6
          }
        ]
      },
      "height": {
        "two_slope": [
          {
            "max": 6,
            "coef": 0.0
          },
          {
            "max": 7,
            "coef": 0.25
          },
          {
            "max": 9,
            "coef": 0.5
          },
          {
            "max": 12,
            "coef": 1.0
          },
          {
            "above": 12,
            "coef": 0.75,
            "step": 3
          }
        ],
        "one_slope": [
          {
            "max": 4,
            "coef": 0.0
          },
          {
            "max": 6,
            "coef": 0.25
          },
          {
            "max": 8,
            "coef": 0.5
          },
          {
            "max": 10,
            "coef": 1.0
          },
          {
            "above": 10,
            "coef": 0.45,
            "step": 3
          }
        ]
      },
      "multi_span": {
        "two_slope": {
          "first_span": 1.6,
          "additional_span": 0.4
        },
        "one_slope": {
          "first_span": 1.8,
          "additional_span": 0.6
        },
        "flat": {
          "first_span": 1.6,
          "additional_span": 0.3
        },
        "multi_slope": {
          "first_span": 1.6,
          "additional_span": 0.4
        }
      },
      "metal_consumption_kg_m2": 40,
      "crane": {
        "support_single_span": 0.9,
        "support_per_span": 0.6,
        "support_diff_capacity": 0.2,
        "suspension_single_span": 0.7,
        "suspension_per_span": 0.5,
        "suspension_diff_capacity": 0.2
      }
    },
    "Атлант-М": {
      "base_coef": {
        "two_slope": 1.7,
        "one_slope": 1.9,
        "flat": 1.7,
        "multi_slope": 1.7
      },
      "span": {
        "two_slope": [
          {
            "max": 12,
            "coef": 0.0,
            "new_span_coef": 1.05
          },
          {
            "max": 18,
            "coef": 0.45,
            "new_span_coef": 1.05
          },
          {
            "max": 24,
            "coef": 0.9,
            "new_span_coef": 0.8
          },
          {
            "max": 30,
            "coef": 1.65,
            "new_span_coef": 0.8
          },
          {
            "max": 36,
            "coef": 2.75,
            "new_span_coef": 0.55
          },
          {
            "above": 36,
            "coef": 1.5,
            "new_span_coef": 0.15,
            "step": 6
          }
        ],
        "one_slope": [
          {
            "max": 12,
            "coef": 0.0,
            "new_span_coef": 1.05
          },
          {
            "max": 18,
            "coef": 0.45,
            "new_span_coef": 1.05
          },
          {
            "max": 24,
            "coef": 0.9,
            "new_span_coef": 0.8
          },
          {
            "max": 30,
            "coef": 1.65,
            "new_span_coef": 0.8
          },
          {
            "max": 36,
            "coef": 2.75,
            "new_span_coef": 0.55
          },
          {
            "above": 36,
            "coef": 1.5,
            "new_span_coef": 0.15,
            "step": 6
          }
        ]
      },
      "height": {
        "two_slope": [
          {
            "max": 6,
            "coef": 0.0
          },
          {
            "max": 7,
            "coef": 0.25
          },
          {
            "max": 9,
            "coef": 0.5
          },
          {
            "max": 12,
            "coef": 1.0
          },
          {
            "above": 12,
            "coef": 0.75,
            "step": 3
          }
        ],
        "one_slope": [
          {
            "max": 4,
            "coef": 0.0
          },
          {
            "max": 6,
            "coef": 0.25
          },
          {
            "max": 8,
            "coef": 0.5
          },
          {
            "max": 10,
            "coef": 1.0
          },
          {
            "above": 10,
            "coef": 0.45,
            "step": 3
          }
        ]
      },
      "multi_span": {
        "two_slope": {
          "first_span": 1.7,
          "additional_span": 0.35
        },
        "one_slope": {
          "first_span": 1.9,
          "additional_span": 0.55
        },
        "flat": {
          "first_span": 1.7,
          "additional_span": 0.25
        },
        "multi_slope": {
          "first_span": 1.7,
          "additional_span": 0.35
        }
      },
      "metal_consumption_kg_m2": 36,
      "crane": {
        "support_single_span": 0.9,
        "support_per_span": 0.6,
        "support_diff_capacity": 0.2,
        "suspension_single_span": 0.7,
        "suspension_per_span": 0.5,
        "suspension_diff_capacity": 0.2
      }
    }
  },
  "global_modifiers": {
    "country": {
      "russia": 1.0,
      "other": {
        "coef": "choose_by_ref",
        "ref": "B162",
        "value": 1.3,
        "note": "Еврокод — 30% усложнение узлов"
      }
    },
    "seismic": {
      "levels": [
        {
          "max": 6,
          "coef": 0.0,
          "global_multiplier": 1.0
        },
        {
          "max": 7,
          "coef": 0.0,
          "global_multiplier": 1.0
        },
        {
          "max": 8,
          "coef": 0.2,
          "global_multiplier": 1.0
        },
        {
          "max": 9,
          "coef": 0.4,
          "global_multiplier": 1.0
        },
        {
          "above": 9,
          "global_multiplier": 1.05,
          "note": "за доп усложненные связи"
        }
      ]
    },
    "eurocode": {
      "global_multiplier": 1.3,
      "note": "перемножить итоговую стоимость каркаса"
    },
    "overhead_rate": {
      "default": 0,
      "description": "Издержки (аренда, налоги) — добавляется к итогу в процентах"
    }
  },
  "additional_elements": {
    "roof_cladding": {
      "two_slope_profile": {
        "span_ranges": [
          {
            "max": 15,
            "coef": 0.05
          },
          {
            "max": 30,
            "coef": 0.1
          },
          {
            "max": 45,
            "coef": 0.15
          },
          {
            "max": 60,
            "coef": 0.2
          },
          {
            "max": 75,
            "coef": 0.25
          },
          {
            "max": 90,
            "coef": 0.3
          },
          {
            "max": 105,
            "coef": 0.35
          },
          {
            "max": 120,
            "coef": 0.4
          },
          {
            "max": 135,
            "coef": 0.45
          },
          {
            "max": 150,
            "coef": 0.5
          }
        ],
        "area_over_400": {
          "threshold": 400,
          "step": 30,
          "coef_per_step": 0.001
        }
      },
      "two_slope_sandwich_layer": {
        "span_ranges": [
          {
            "max": 15,
            "coef": 0.1
          },
          {
            "max": 30,
            "coef": 0.2
          },
          {
            "max": 45,
            "coef": 0.25
          },
          {
            "max": 60,
            "coef": 0.3
          },
          {
            "max": 75,
            "coef": 0.35
          },
          {
            "max": 90,
            "coef": 0.4
          },
          {
            "max": 105,
            "coef": 0.45
          },
          {
            "max": 120,
            "coef": 0.5
          },
          {
            "max": 135,
            "coef": 0.55
          },
          {
            "max": 150,
            "coef": 0.6
          }
        ],
        "area_over_400": {
          "threshold": 400,
          "step": 30,
          "coef_per_step": 0.0015
        }
      },
      "two_slope_sandwich": {
        "span_ranges": [
          {
            "max": 24,
            "coef": 0.05
          },
          {
            "max": 45,
            "coef": 0.1
          },
          {
            "max": 60,
            "coef": 0.15
          },
          {
            "max": 75,
            "coef": 0.2
          },
          {
            "max": 90,
            "coef": 0.25
          },
          {
            "max": 105,
            "coef": 0.3
          },
          {
            "max": 120,
            "coef": 0.35
          },
          {
            "max": 135,
            "coef": 0.4
          },
          {
            "max": 150,
            "coef": 0.45
          }
        ],
        "area_over_400": {
          "threshold": 400,
          "step": 30,
          "coef_per_step": 0.0015
        }
      },
      "one_slope_profile": {
        "span_ranges": [
          {
            "max": 8,
            "coef": 0.05
          },
          {
            "max": 15,
            "coef": 0.1
          },
          {
            "max": 22,
            "coef": 0.15
          },
          {
            "max": 30,
            "coef": 0.2
          },
          {
            "max": 37,
            "coef": 0.25
          },
          {
            "max": 45,
            "coef": 0.3
          },
          {
            "max": 52,
            "coef": 0.35
          },
          {
            "max": 60,
            "coef": 0.4
          },
          {
            "max": 67,
            "coef": 0.45
          },
          {
            "max": 75,
            "coef": 0.5
          }
        ],
        "area_over_400": {
          "threshold": 400,
          "step": 30,
          "coef_per_step": 0.001
        }
      }
    },
    "walls": {
      "types": {
        "sandwich_horizontal": {
          "base": 0.15,
          "seismic_7plus": 0.4,
          "seismic_7plus_vertical": 0.5
        },
        "profile_V": {
          "base": 0.4,
          "over_300": 0.003
        },
        "profile_II_III_IV": {
          "base": 0.5,
          "over_300": 0.004
        },
        "sandwich_layer_200_250": {
          "base": 0.4,
          "over_300": 0.003
        },
        "sandwich_layer_150": {
          "base": 0.5,
          "over_300": 0.0045
        },
        "sandwich_layer_100": {
          "base": 0.6,
          "over_300": 0.006
        }
      },
      "thickness": {
        "1": 100,
        "2": 150,
        "3": 200
      },
      "windows": {
        "per_unit": 0.02,
        "extra_types": 0.04
      },
      "doors": {
        "per_unit": 0.02,
        "extra_types": 0.04
      }
    },
    "gates": {
      "per_unit": 0.05,
      "extra_types": 0.05
    },
    "stairs": {
      "concrete_steps": {
        "1_flight": 0.3,
        "2_flights": 0.45,
        "3_flights": 0.6,
        "4plus_flights": 0.8
      },
      "metal_steps": {
        "1_flight": 0.45,
        "2_flights": 0.7,
        "3_flights": 0.95,
        "4plus_flights": 1.2
      }
    },
    "mezzanine": {
      "base": 0.55,
      "per_item": true
    },
    "overhead_floor": {
      "base": 0.75,
      "per_span": true,
      "multi_floor": {
        "base": 0.75,
        "per_additional": 0.25
      }
    },
    "subtruss": {
      "great": {
        "base": 0.5,
        "per_span_after_2nd": 0.5
      }
    },
    "roof_railing": {
      "sandwich_layer": 0.0,
      "profile": 0.05,
      "present": 0.04
    },
    "snow_retention": {
      "present": 0.04
    },
    "cranes": {
      "support": {
        "single_span": {
          "great": 0.75,
          "atlas": 0.9,
          "atlas_m": 0.9
        },
        "per_span": {
          "great": 0.6,
          "atlas": 0.6,
          "atlas_m": 0.6
        },
        "diff_capacity": {
          "great": 0.2,
          "atlas": 0.2,
          "atlas_m": 0.2
        }
      },
      "suspension": {
        "single_span": {
          "great": 0.6,
          "atlas": 0.7
        },
        "per_span": {
          "great": 0.5,
          "atlas": 0.5
        },
        "diff_capacity": {
          "great": 0.2,
          "atlas": 0.2
        }
      }
    },
    "partitions": {
      "gvl": {
        "base": 0.2,
        "over_100": 0.015
      },
      "sandwich": {
        "base": 0.2,
        "over_100": 0.015
      },
      "sandwich_layer": {
        "base": 0.4,
        "over_100": 0.03
      },
      "gates": 0.075,
      "doors_windows": {
        "gvl": 0.04,
        "sandwich": 0.035,
        "sandwich_layer": 0.02,
        "metal": 0.025
      }
    },
    "parapet": {
      "long_with_overhang": {
        "up_to_30m": 0.4,
        "per_6m": 0.01
      },
      "long_without_overhang": {
        "up_to_30m": 0.3,
        "per_6m": 0.01
      },
      "end": {
        "up_to_15m": 0.3,
        "per_3m": 0.01
      }
    }
  },
  "geometry_rules": {
    "length_steps": {
      "no_crane": {
        "up_to_5": 0.0,
        "per_step": 0.05,
        "per_step_crane": 0.07
      },
      "crane_every_span": {
        "up_to_5": 0.0,
        "per_step": 0.07,
        "per_step_diff": 0.04
      }
    },
    "different_step": {
      "coef": 0.2
    },
    "width_steps": {
      "up_to_2": 0.0,
      "per_step": 0.1
    }
  },
  "calculation_formula": {
    "description": "Итоговая стоимость = База × (1 + Σ коэффициентов по разделам) × Множители × Площадь",
    "steps": [
      "1. Выбрать систему (Спринт-М/2М/Великан/Атлант/Атлант-М/Крон)",
      "2. Выбрать тип кровли (двускатная / односкатная / плоская / многоскатная)",
      "3. Применить базовый коэффициент системы",
      "4. Добавить коэффициент пролета (по диапазону, для многопролетных — доп. пролеты)",
      "5. Добавить коэффициент высоты (по диапазону, сверх 12м — за каждые 3м)",
      "6. Добавить коэффициенты длины/ширины (шаг рам, разный шаг)",
      "7. Добавить краны (опорные/подвесные, за пролет, за грузоподъемность)",
      "8. Добавить антресоли (1-3, за штуку)",
      "9. Добавить перекрытия (за пролет, многоэтажность)",
      "10. Добавить подстропильные фермы (Великан, за пролет после 2го)",
      "11. Добавить лестницы (Ж/Б или металл, 1-4 маршей)",
      "12. Добавить ограждение кровли (профлист/СП/наличие)",
      "13. Добавить снегозадержание",
      "14. Добавить стены (тип, толщина, окна, двери, ворота)",
      "15. Добавить перегородки (ГВЛ/СП/послойная сборка)",
      "16. Добавить парапеты",
      "17. Применить сейсмику (множитель 1.0-1.05 или +0.2-0.4)",
      "18. Применить Еврокод (×1.3, если выбран)",
      "19. Умножить на площадь",
      "20. Добавить наценку издержек (X2)"
    ]
  }
};

type MutableModel<T> =
  T extends number ? number :
  T extends string ? string :
  T extends boolean ? boolean :
  T extends ReadonlyArray<infer U> ? Array<MutableModel<U>> :
  T extends object ? { -readonly [K in keyof T]: MutableModel<T[K]> } :
  T;

export type CalculatorCoefficientModel = MutableModel<typeof CALCULATOR_COEFFICIENTS>;

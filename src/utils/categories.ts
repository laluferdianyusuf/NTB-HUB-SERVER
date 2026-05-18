export const categories = [
  {
    id: "a55c2d0e-c5d1-4424-b296-aa0b10e04fda",
    name: "Sport & Fitness",
    code: "SPORT_FITNESS",
    icon: "sport",
    isActive: true,
    subCategories: [
      {
        id: "239d9f1c-5854-41ca-a869-85f72eae6b65",
        name: "Mini Soccer",
        code: "MINI_SOCCER",
        description:
          "Lapangan futsal ukuran mini untuk latihan dan pertandingan kecil.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "99f8b4d1-494b-450b-a887-98cd0f094868",
        name: "Futsal",
        code: "FUTSAL",
        description: "Lapangan futsal standar untuk tim atau liga komunitas.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "93af68bd-284f-44c1-92bf-c829df0eec99",
        name: "Badminton",
        code: "BADMINTON",
        description:
          "Lapangan badminton indoor untuk olahraga rekreasi atau turnamen.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "104b3013-fa58-4114-a2fc-08ff055b0158",
        name: "Tennis",
        code: "TENNIS",
        description:
          "Lapangan tenis untuk latihan, pertandingan, atau kelas privat.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "d7772320-75a6-48e7-afeb-26441252e33f",
        name: "Basketball",
        code: "BASKETBALL",
        description:
          "Lapangan basket indoor/outdoor untuk latihan dan pertandingan.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "5b0d20f5-e550-4efe-8ec5-4e16d1c189c8",
        name: "Gym",
        code: "GYM",
        description:
          "Tempat olahraga dengan peralatan fitness lengkap untuk individu atau kelompok.",
        defaultConfig: {
          sessions: [
            {
              id: "1",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "cc5fc844-f2c9-4004-a822-f66943d2fcc2",
        name: "Yoga Studio",
        code: "YOGA_STUDIO",
        description: "Studio khusus yoga dengan instruktur profesional.",
        defaultConfig: {
          sessions: [
            {
              id: "2",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "c30b3c4b-c4dd-4b83-a40d-d94fb4f7157a",
        name: "Pilates",
        code: "PILATES",
        description:
          "Studio pilates untuk latihan kekuatan inti dan fleksibilitas.",
        defaultConfig: {
          sessions: [
            {
              id: "3",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "0ecd3218-af91-4c13-ac2e-bb4c335ce465",
        name: "Swimming Pool",
        code: "SWIMMING_POOL",
        description:
          "Kolam renang indoor/outdoor untuk latihan, kelas renang, dan rekreasi.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "9de44d04-6105-4e42-8d3e-359200fad97b",
        name: "Golf / Driving Range",
        code: "GOLF",
        description:
          "Lapangan golf atau driving range untuk latihan pukulan dan putting.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
    ],
  },

  {
    id: "a8868374-947d-425d-ac56-c34e2339d228",
    name: "Food",
    code: "FOOD_BEVERAGE",
    icon: "food",
    isActive: true,
    subCategories: [
      {
        id: "4e5434a0-53f9-46c0-8c1c-cdf2719c15f5",
        name: "Cafe",
        code: "CAFE",
        description: "Tempat minum kopi atau nongkrong dengan suasana santai.",
        defaultConfig: {},
      },
      {
        id: "80fea6c2-bcb6-4abd-b424-dba0a7846b30",
        name: "Restaurant",
        code: "RESTAURANT",
        description:
          "Restoran dengan menu makanan beragam untuk makan siang, malam, atau event kecil.",
        defaultConfig: {},
      },
      {
        id: "25313aa8-5589-495c-9fcd-932b80e421f5",
        name: "Coffee Shop",
        code: "COFFEE_SHOP",
        description:
          "Tempat khusus menyajikan kopi berkualitas untuk pelanggan umum.",
        defaultConfig: {},
      },
      {
        id: "d1a64c8a-eef9-4478-98c1-ac17d617812a",
        name: "Rooftop Cafe",
        code: "ROOFTOP_CAFE",
        description:
          "Cafe di atap gedung dengan pemandangan dan suasana santai.",
        defaultConfig: {},
      },
      {
        id: "3f3e93d4-eba3-47fb-a03f-20d8fc2d6bc9",
        name: "Coworking Cafe",
        code: "COWORKING_CAFE",
        description: "Tempat minum kopi sekaligus ruang kerja bersama.",
        defaultConfig: {
          sessions: [
            {
              id: "4",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "7ea6f4e4-46fa-4344-a2a9-bb00758eaeac",
        name: "Bakery",
        code: "BAKERY",
        description:
          "Toko roti dan kue untuk konsumsi langsung atau dibawa pulang.",
        defaultConfig: {},
      },
    ],
  },

  {
    id: "55fee17b-3575-46f9-b94f-c34a289e3f88",
    name: "Entertainment",
    code: "ENTERTAINMENT",
    icon: "entertainment",
    isActive: true,
    subCategories: [
      {
        id: "444c39fe-67b1-43bd-86f3-2d2670ac046e",
        name: "Billiard",
        code: "BILLIARD",
        description: "Tempat bermain billiard untuk individu atau kelompok.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "a4137a51-a70b-4281-80ff-31238f949f21",
        name: "Karaoke",
        code: "KARAOKE",
        description: "Ruang karaoke untuk hiburan bersama teman atau keluarga.",
        defaultConfig: {
          sessions: [
            {
              id: "5",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "2205090c-a2ba-44a9-9e03-30a1569d0145",
        name: "Game Center",
        code: "GAME_CENTER",
        description: "Pusat permainan arcade untuk semua usia.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "48330de0-9a0f-46dc-bad1-df8eafeb3c43",
        name: "VR Gaming",
        code: "VR_GAMING",
        description: "Ruang gaming virtual reality untuk pengalaman imersif.",
        defaultConfig: {
          sessions: [
            {
              id: "6",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "16f789eb-085b-4d00-9410-88877123b214",
        name: "Escape Room",
        code: "ESCAPE_ROOM",
        description: "Ruang permainan tantangan teka-teki untuk kelompok.",
        defaultConfig: {
          sessions: [
            {
              id: "7",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "e451765c-8aaa-4fad-aec0-786ddc1d4e31",
        name: "Bowling",
        code: "BOWLING",
        description: "Tempat bowling indoor untuk hiburan dan turnamen.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
    ],
  },
  {
    id: "5a34fa89-66c3-462b-99b8-d5df2b9cd46f",
    name: "Meeting",
    code: "MEETING_WORKSPACE",
    icon: "meeting",
    isActive: true,
    subCategories: [
      {
        id: "019edfba-ddb0-4b9c-b4ea-72f30bb075f1",
        name: "Meeting Room",
        code: "MEETING_ROOM",
        description: "Ruang meeting profesional untuk rapat bisnis.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "b12046c5-56fb-4aff-a8fc-4780a6070623",
        name: "Coworking Space",
        code: "COWORKING_SPACE",
        description: "Ruang kerja bersama dengan fasilitas lengkap.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "16d36c21-88df-4f8a-8af9-9690dd64adc2",
        name: "Private Office",
        code: "PRIVATE_OFFICE",
        description: "Kantor privat untuk tim atau individu.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "43c8052f-d710-4fdd-ad50-4e80e3c7a264",
        name: "Training Room",
        code: "TRAINING_ROOM",
        description:
          "Ruang untuk pelatihan atau workshop dengan peralatan lengkap.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
      {
        id: "7e44c1c7-ca5c-4f94-8375-0cd3fe381026",
        name: "Seminar Hall",
        code: "SEMINAR_HALL",
        description:
          "Aula atau hall untuk seminar, presentasi, dan konferensi.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 180,
          minDurationMinutes: 30,
          durationStepMinutes: 30,
        },
      },
    ],
  },

  {
    id: "aa357cb2-4d14-4bf7-bd65-6a3688073ad3",
    name: "Beauty",
    code: "WELLNESS_BEAUTY",
    icon: "beauty",
    isActive: true,
    subCategories: [
      {
        id: "604d4723-5382-4aea-a741-41f002c1b82a",
        name: "Spa",
        code: "SPA",
        description: "Tempat relaksasi dan perawatan tubuh profesional.",
        defaultConfig: {
          sessions: [
            {
              id: "13",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "cf2ef48d-e7a7-49d2-93a6-002291ec2556",
        name: "Massage",
        code: "MASSAGE",
        description: "Layanan pijat untuk relaksasi dan kesehatan.",
        defaultConfig: {
          sessions: [
            {
              id: "14",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "3892a3b3-8bbe-4f0b-b26d-6586f988c00f",
        name: "Salon",
        code: "SALON",
        description: "Salon kecantikan untuk perawatan rambut dan wajah.",
        defaultConfig: {
          sessions: [
            {
              id: "15",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "b2ab0bd3-b9c7-4093-a1ba-50f655217ba7",
        name: "Barbershop",
        code: "BARBERSHOP",
        description: "Layanan potong rambut dan grooming pria.",
        defaultConfig: {
          sessions: [
            {
              id: "16",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "cd361885-3043-4202-825c-50cbcb1c11ed",
        name: "Facial Clinic",
        code: "FACIAL_CLINIC",
        description: "Klinik perawatan kulit dan wajah profesional.",
        defaultConfig: {
          sessions: [
            {
              id: "17",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
    ],
  },

  {
    id: "ba96630a-64ca-4c68-b630-f3c713117fa6",
    name: "Education",
    code: "EDU_TRAINING",
    icon: "training",
    isActive: true,
    subCategories: [
      {
        id: "d99fa381-6363-4cf5-b663-04bd058074fc",
        name: "Kursus Bahasa",
        code: "KURSUS_BAHASA",
        description:
          "Tempat belajar bahasa asing dengan instruktur profesional.",
        defaultConfig: {
          sessions: [
            {
              id: "18",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "1841b10a-e999-4e0c-9f3c-1b72db060cf2",
        name: "Musik",
        code: "MUSIK",
        description: "Kursus musik untuk berbagai instrumen dan usia.",
        defaultConfig: {
          sessions: [
            {
              id: "19",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "e9f66972-4f82-477f-8b2b-c2ddd7db7780",
        name: "Coding Bootcamp",
        code: "CODING_BOOTCAMP",
        description: "Program intensif untuk belajar coding dan teknologi.",
        defaultConfig: {
          sessions: [
            {
              id: "20",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "fec75507-0833-4ab3-a069-10c12606e1b5",
        name: "Bimbel",
        code: "BIMBEL",
        description: "Bimbingan belajar akademik untuk siswa sekolah.",
        defaultConfig: {
          sessions: [
            {
              id: "21",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "ba5eb4d0-0a0b-4a0b-b502-8b660d3a00dc",
        name: "Private Tutor",
        code: "PRIVATE_TUTOR",
        description: "Les privat dengan pengajar profesional sesuai kebutuhan.",
        defaultConfig: {
          sessions: [
            {
              id: "22",
              start: "08:00",
              end: "09:00",
              label: "Session 1",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
    ],
  },

  {
    id: "0462e427-c3ed-40b2-8b5c-63614b682be3",
    name: "Travel",
    code: "TRAVEL_TOURISM",
    icon: "travel",
    isActive: true,
    subCategories: [
      {
        id: "34193da4-2d08-4daa-9f59-70e30a614bae",
        name: "Hotel",
        code: "HOTEL",
        description: "Penginapan hotel untuk perjalanan bisnis atau liburan.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
        },
      },
      {
        id: "44d6ee7d-ef82-4af4-a326-3a7fdfa560c0",
        name: "Villa",
        code: "VILLA",
        description: "Villa pribadi untuk liburan keluarga atau grup.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
        },
      },
      {
        id: "f9c513cc-967e-40d9-be18-24222966ba05",
        name: "Resort",
        code: "RESORT",
        description: "Resort wisata dengan fasilitas lengkap untuk rekreasi.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
        },
      },
      {
        id: "8ae42945-43d2-4c59-a845-1fd307adae25",
        name: "Tour Package",
        code: "TOUR_PACKAGE",
        description: "Paket wisata dengan itinerary dan pemandu wisata.",
        defaultConfig: {
          sessions: [
            {
              id: "23",
              start: "08:00",
              end: "17:00",
              label: "Tour Session",
              quota: 20,
              price: 100,
            },
          ],
        },
      },
      {
        id: "62c11fc0-0ee1-48f9-8aa0-3b1566cd5dc7",
        name: "Car Rental",
        code: "CAR_RENTAL",
        description: "Penyewaan mobil untuk perjalanan pribadi atau bisnis.",
        defaultConfig: {
          sections: {
            units: true,
            schedule: true,
          },
          maxDurationMinutes: 1440,
          minDurationMinutes: 60,
          durationStepMinutes: 60,
        },
      },
      {
        id: "1882cc0a-b8bb-49b0-96fc-955eddb90480",
        name: "Boat Trip",
        code: "BOAT_TRIP",
        description: "Wisata laut menggunakan kapal untuk rekreasi.",
        defaultConfig: {
          sessions: [
            {
              id: "24",
              start: "09:00",
              end: "12:00",
              label: "Morning Trip",
              quota: 15,
              price: 100,
            },
          ],
        },
      },
    ],
  },
  {
    id: "ee85ab58-d782-49cf-a2fc-f2375f31cfa3",
    name: "Health",
    code: "HEALTH_MEDICAL",
    icon: "health",
    isActive: true,
    subCategories: [
      {
        id: "976aaea1-c11c-4293-96ab-795052757115",
        name: "Clinic",
        code: "CLINIC",
        description: "Klinik kesehatan umum untuk pemeriksaan dan konsultasi.",
        defaultConfig: {
          sessions: [
            {
              id: "25",
              start: "09:00",
              end: "09:30",
              label: "Consultation",
              quota: 5,
              price: 100,
            },
          ],
        },
      },
      {
        id: "d0547853-f4e3-4e7a-b98e-eff97ed6e36a",
        name: "Dental Clinic",
        code: "DENTAL_CLINIC",
        description: "Klinik gigi untuk pemeriksaan dan perawatan gigi.",
        defaultConfig: {
          sessions: [
            {
              id: "26",
              start: "10:00",
              end: "10:30",
              label: "Dental Session",
              quota: 5,
              price: 100,
            },
          ],
        },
      },
      {
        id: "f135dbc8-d4fe-4e4b-9f06-d9168f98e4a3",
        name: "Medical Checkup",
        code: "MEDICAL_CHECKUP",
        description: "Layanan pemeriksaan kesehatan lengkap.",
        defaultConfig: {
          sessions: [
            {
              id: "27",
              start: "08:00",
              end: "09:00",
              label: "Checkup Session",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
      {
        id: "e3e9d9da-24b3-4b3e-8853-d10ad8cb7c0c",
        name: "Physiotherapy",
        code: "PHYSIOTHERAPY",
        description: "Terapi fisik untuk pemulihan cedera atau rehabilitasi.",
        defaultConfig: {
          sessions: [
            {
              id: "28",
              start: "11:00",
              end: "12:00",
              label: "Therapy Session",
              quota: 5,
              price: 100,
            },
          ],
        },
      },
      {
        id: "9ca8a7ea-08cb-4b4a-8f02-950860d44f9e",
        name: "Laboratory",
        code: "LABORATORY",
        description: "Layanan tes laboratorium medis.",
        defaultConfig: {
          sessions: [
            {
              id: "29",
              start: "08:00",
              end: "08:30",
              label: "Lab Test",
              quota: 10,
              price: 100,
            },
          ],
        },
      },
    ],
  },
];

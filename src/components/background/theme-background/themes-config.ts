import {
  cloud,
  cloud_1,
  cloud_2,
  cloud_3,
  tree,
  land,
  house,
  stage
 } from '@constants'

export const themeSample1 = {
  name: "sunny-day",

  background_color: "skyblue", //"#2a2b2d",  // Dark blue for a night-time feel
  className: 'theme_sample_1',
  gridAreas: [  //Defines how many grid areas we want,
    {
      id: 'grid-area-1',
      className: 'grid-area cloud',
      img: {
        path: cloud_1,
        alt: "Cloud 1",
        id: ""
      },
    },
    {
      id: 'grid-area-2',
      className: 'grid-area cloud',
      img: {
        path: cloud_2,
        alt: "Cloud 2",
        id: ""
      },
    },
    {
      id: 'grid-area-3',
      className: 'grid-area cloud',
      img: {
        path: cloud_3,
        alt: "Cloud 3",
        id: ""
      },
    },
    {
      id: 'grid-area-4',
      className: 'grid-area',
      img: {
        path: tree,
        alt: "Tree",
        id: ""
      },
    },
    {
      id: 'grid-area-5',
      className: 'grid-area',
      img: {
        path: land,
        alt: "Land",
        id: ""
      },
    },
    {
      id: 'grid-area-6',
      className: 'grid-area',
      img: {
        path: house,
        alt: "House",
        id: ""
      },
    },
    {
      id: 'grid-area-7',
      className: 'grid-area',
      img: {
        path: stage,
        alt: "Stage",
        id: ""
      },
    },
  ],
}

//This will be moved in game settings as this is the list of all themes we have.
export const theme_config = {
  default: themeSample1,
  /** declare more c */
}
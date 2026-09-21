# 3goods

*A Data for Life 2026 prototype for coordinating donations between donors and organisations.*

[Try the live site](https://3goods.vercel.app/)

[<img width='1440' alt='Updated 3goods landing page' src='https://github.com/user-attachments/assets/73a6a0ce-85e8-4a14-bc2b-239f53d49589' />](https://3goods.vercel.app/)

3goods is a collaborative platform that helps organisations share what they need and helps donors see where goods can make the greatest difference.

## Why we built it

The problem felt close to home. My teammate and I have both volunteered for a long time, so community-service problems like this one are close to our hearts. In this problem, generous donations can still miss the people they are meant to help. One organisation may receive too much of the wrong thing while another still faces a shortage.

We started with that gap and asked a simple question: what if organisations could say what they need, and donors could see where their items would be most useful?

## From an idea to a prototype

We brainstormed the donor and organisation journeys together, worked through the matching idea, and built the prototype with Claude Code Pro (subscription, no API) in roughly four days.

The web application uses React, JavaScript, Vite, Tailwind CSS and Supabase, and is deployed on Vercel. A custom SVG map and small serverless API present data from OpenStreetMap, EM-DAT, UNDP/MOLISA and GADM. Python scripts were used offline to clean, combine and score the source data before the resulting map datasets were published for the JavaScript application.

This is a two-person hackathon prototype, not a finished donation service. It is our attempt to make the handoff between generosity and real need clearer, and to help every useful item find a more thoughtful next home.

## If you are donating

Start with the map, choose a country and see which goods are most needed there.

[<img width='1440' alt='3goods global needs map' src='https://github.com/user-attachments/assets/e2c50ac4-d41f-4754-b04e-34821359e89c' />](https://3goods.vercel.app/)

## If you represent an organisation

Register or log in, add your current needs and make those needs visible to donors.

<table>
  <tr>
    <td width='50%'><img alt='3goods organisation registration form' src='https://github.com/user-attachments/assets/072135be-4531-49ba-a9a6-a0cbaf9b2da0' /></td>
    <td width='50%'><img alt='3goods organisation login page' src='https://github.com/user-attachments/assets/55902144-400d-417a-88b3-5b5e22b904df' /></td>
  </tr>
</table>

## Run it locally

```bash
npm install
npm run dev
```

For local data and authentication, add your own Supabase environment values.

## Credits

Built by **Bao Long** and **Frida** for the [Data for Life 2026](https://dataforlife2026.devpost.com/) hackathon.

### Data sources

- [OpenStreetMap](https://www.openstreetmap.org/)
- [EM-DAT](https://www.emdat.be/)
- [UNDP / MOLISA](https://www.undp.org/vietnam)
- [GADM](https://gadm.org/)

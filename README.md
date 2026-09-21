# 3goods

*A Data for Life 2026 prototype for coordinating donations between donors and organisations.*

[Try the live site](https://3goods.vercel.app/)

<img width="1440" alt="3goods landing page" src="https://github.com/user-attachments/assets/f5feff45-1e43-47c6-895a-d7cabf80885d" />

## Why we built it

Data for Life 2026 gave us a social-security problem statement from the 86th Command, Ministry of National Defence: build a system that coordinates donations based on actual needs. The hackathon was backed by AI Singapore and introduced to us through NUS-ISS.

<img width="1080" alt="Data for Life 2026 problem statement from the 86th Command, Ministry of National Defence" src="https://github.com/user-attachments/assets/7dde859f-1e53-4e74-bcbd-dd514c75ba58" />

The problem felt close to home. My teammate and I have both volunteered for a long time, so community-service problems like this one are close to our hearts. In this problem, generous donations can still miss the people they are meant to help. One organisation may receive too much of the wrong thing while another still faces a shortage.

We started with that gap and asked a simple question: what if organisations could say what they need, and donors could see where their items would be most useful?

## From an idea to a prototype

We brainstormed the donor and organisation journeys together, worked through the matching idea, and built the prototype with Claude Code in roughly four days. The stack is React, JavaScript, Vite, Tailwind CSS and Supabase, with a custom SVG map and a small serverless map API, deployed on Vercel. Map data comes from OpenStreetMap, EM-DAT, UNDP/MOLISA and GADM.

This is a two-person hackathon prototype, not a finished donation service. It is our attempt to make the handoff between generosity and real need clearer, and to help every useful item find a more thoughtful next home.

## If you are donating

You begin with the item you already have. Browse what organisations actually need, then chat the organisation directly to offer your item. If that organisation does not need it right now, your item stays in the marketplace. Other organisations can see it and approach you for as long as it is available. A small act of giving becomes easier when the next step is just a conversation.

<img width="1440" alt="Available donations with needs-matching labels" src="https://github.com/user-attachments/assets/9aea79e4-49d4-4101-9416-6347eb4709dd" />

<img width="1440" alt="Donation item detail" src="https://github.com/user-attachments/assets/6a5fe838-e22a-4b2e-937c-6788199250c5" />

## If you are an organisation

You begin with the people you serve. Create your organisation profile and publish what is genuinely needed, and star your priority items so people know what you actually need most. When you browse goods offered by donors, matching labels show which items may match you and which may match an urgent need you have starred as a priority. When donors reach out, you can go straight to chat to see who is approaching you and what they are offering, then coordinate the handoff there.

<img width="1440" alt="Organisations directory" src="https://github.com/user-attachments/assets/5b1e22ab-a4e1-4d84-a934-d6734e7136b1" />

[<img width="1440" alt="Goods offered by donors with organisation match labels" src="./organisation-matches.svg" />](./organisation-matches.svg)

## The bigger picture

The map lets you see what is going on across Vietnam. You can see who needs what, and where. You might come across a charity you are interested in and invite them to join, right from the map.

[<img width="1440" alt="3goods map showing a registered organisation in Thanh Hoa" src="./map-registered.svg" />](./map-registered.svg)

[<img width="1440" alt="3goods map showing the invite a facility flow in Thai Binh" src="./map-invite.svg" />](./map-invite.svg)

## Please enjoy using the site

The prototype is live at [3goods.vercel.app](https://3goods.vercel.app/).

We hope it makes giving feel a little more thoughtful, receiving a little less overwhelming, and the distance between a generous person and a real need a little shorter.

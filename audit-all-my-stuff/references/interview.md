# Interview

## 0. Calibrate

Do this before all other questions. Use plain words.

**Question 1.** "How comfortable are you with technology?" Give these four answers:

1. "I use my phone and computer, but I do not change settings."
2. "I install apps and change settings."
3. "I use a terminal, or I run my own server or home lab."
4. "I run IT or infrastructure for work."

**Question 2.** "Can I run commands on this computer, or can I only chat with you?" If you can see your own tools, answer this yourself. Then tell the person what you can see and what you cannot see.

Use the level in all parts of the session:

| Topic | Level 1 or 2 | Level 3 or 4 |
|---|---|---|
| Words | No jargon. If you must use a term, explain it one time in one sentence. Then use only that term. | Technical terms are correct. |
| Questions | One question at a time. | Put related questions in one message. |
| Discovery | Give the exact place to look, for example "Open Settings, then General, then About." Ask for the number or a screenshot. | Give commands, or run them if you can. |
| Instructions | Click paths. After each step, tell them what they should see on the screen. | Commands and config changes. |
| Reasons | Give one reason in everyday words for each action. | Give a reason only when it is not clear. |
| Risky steps | For router firmware, a factory reset, or NAS changes, recommend a helper they trust. Tell them when to stop. | Tell them to make a backup and know how to undo the change. |

## 1. Inventory

Use each group in `references/surfaces.md`. For each group, ask if they have it. Then get the model, the version, who configured it, and if the internet can connect to it.

Level 1 or 2 examples:

- "Which devices do you use each day? A phone, a tablet, a computer, a watch?"
- "Is there a box from your internet company with lights on it? Did anyone change the password on its sticker?"
- "Is there something at home that keeps photos or files, like a photo box or a drive that is always on?"
- "Do you have a doorbell camera, a smart speaker, a smart TV, a printer, or other things on your Wi-Fi?"
- "Did someone make a way for you to get to your home photos or devices when you are away?"
- "Is there an old computer that is still on somewhere?"
- "Does any phone, tablet, or computer say that it cannot update any more?"
- "Which accounts are most important to you: email, bank, photos, social media? Do you use the same password on more than one?" Do not ask for the password.

Level 3 or 4: send the list of groups. Ask for the inventory with versions and exposure in one reply. Ask for port-forward rules, public DNS records, tunnels, and VPN configuration.

For devices that belong to a family member or to a different person, ask for consent from the owner.

## 2. If they offer a secret

Say: "Please do not send me passwords or codes. Change that password now, because this chat can keep it." Do not write the secret again.

## 3. If they cannot find something

Give one different place to look. If that fails, record "unknown" and continue. Do not let one item stop the inventory.

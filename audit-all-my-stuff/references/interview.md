# Interview

## 0. Calibrate

Use plain words.

**Question 1.** "How comfortable are you with technology?" Give these four answers:

1. "I use my phone and computer, but I do not change settings."
2. "I install apps and change settings."
3. "I use a terminal, or I run my own server or home lab."
4. "I run IT or infrastructure for work."

The number of their answer is their level.

**Question 2.** "Can I run commands on this computer, or can I only chat with you?" If your tools show the answer, do not ask this question. When you know the answer, tell the person what you can see and what you cannot see.

Use the level in all parts of the session:

| Topic | Level 1 or 2 | Level 3 or 4 |
|---|---|---|
| Words | No jargon. If you must use a term, explain it one time in one sentence. Then use only that term. | Use technical terms. |
| Questions | Ask one question at a time. | Put related questions in one message. |
| Discovery | Give the exact place to look, for example "Open Settings, then General, then About." Ask for the number or a screenshot. | Give commands, or run them if you can. |
| Instructions | Give click paths. After each step, say what they will see on the screen. | Give commands and config changes. |
| Reasons | Give one reason in everyday words for each action. | Give a reason only when it is not clear. |
| Risky steps | For router firmware, a factory reset, or NAS changes, recommend a helper they trust. Tell them when to stop. | Tell them to make a backup and to know how to undo the change. |

## 1. Inventory

Level 1 or 2 examples:

- "Which devices do you use each day? A phone, a tablet, a computer, a watch?"
- "Is there a box from your internet company with lights on it? Did anyone change the password on its sticker?"
- "Is there something at home that keeps photos or files, like a photo box or a drive that is always on?"
- "Do you have a doorbell camera, a smart speaker, a smart TV, a printer, or other things on your Wi-Fi?"
- "Did someone make a way for you to get to your home photos or devices when you are away?"
- "Is there an old computer that is still on somewhere?"
- "Does any phone, tablet, or computer say that it cannot update any more?"
- "Which accounts are most important to you: email, bank, photos, social media? Do you use the same password on more than one?"

For level 3 or 4, send the list of groups in `references/surfaces.md`. Ask for the inventory, with versions and exposure, in one reply. Also ask for port-forward rules, public DNS records, tunnels, and VPN configuration.

## 2. If they cannot find something

Give one other place to look. If they cannot find it there, record "unknown" and continue the inventory.

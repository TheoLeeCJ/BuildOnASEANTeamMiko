"missing" means one or more form fields are empty

## /account/register
FormData fields required: username, email, password

| JSON key | value |
| --- | --- |
| msg.success | true / false |
| msg.reason | "missing" / "username-taken" (if msg.success false) |
| msg.jwt | <jwt, please save it client-side somewhere and send it with all requests from then on> (if msg.success true) |

## /account/login
FormData fields required: username, password

| JSON key | value |
| --- | --- |
| msg.success | true / false |
| msg.reason | "missing" / "incorrect" (if msg.success false) |
| msg.jwt | <jwt, please save it client-side somewhere and send it with all requests from then on> (if msg.success true) |

## /account/details - WIP
Obtains information about user profile

FormData fields required: jwt

| JSON key | value |
| --- | --- |
| msg.success | true / false |
| msg.reason | "missing" / "no-auth" (if msg.success false) |
| msg.user | JSON object containing user's info (if msg.success true) |

## /item/get-upload-key
Undocumented because I'll be writing the interactions with this API. Also because it's actually complicated.

## /item/create - WIP
List a new product

FormData fields required:
- jwt
- category
- images (ARRAY of URLs)
- name
- description
- price
- preferredLocations
- multipleAvailable
- conditionFields (JSON string, the answerImg refers to the URL of the image obtained from /item/get-upload-key)
```JSON
[
  {
    "question": "Do these clothes have any tough stains?",
    "answerTxt": "Yes, on the waist area.",
    "answerImg": "url"
  },
  {
    "question": "How long were these clothes in use?",
    "answerTxt": "",
    "answerImg": null
  }
]
```

| JSON key | value |
| --- | --- |
| msg.success | true / false |
| msg.reason | "no-auth" / "missing" / "blocked" / "no-images (if msg.success false) |
| msg.id | listing's UUID (if msg.success true) |

## /item/search - WIP
Search listings and get basic information about results, up to 10 items at a time

FormData fields required:
- (NO NEED JWT, even non-logged-in users can view these)
- query (search term)
- page (pagination, int)

| JSON key | value |
| --- | --- |
| msg.success | true / false |
| msg.reason | "missing" / "blocked" (if msg.success false) |
| msg.items | JSON array representing items found, can be zero-length (if msg.success true) |

## /item/details/<UUID> - WIP
Get detailed information about a listing
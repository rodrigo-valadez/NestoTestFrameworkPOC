# Signup coverage depth

The automated coverage reaches successful account creation and the first authenticated post-signup page. It does not continue into the mortgage quote questionnaire.

| Journey depth              | Evidence                                                                                                                               | Current state                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Signup page loads          | Both locale routes return successfully and expose the complete visible form                                                            | Covered across Chromium, Firefox, and WebKit in English and French                          |
| Language and consent       | Language switching remains in signup; partner consent toggles and the approved submitted state is `true`                               | Covered read-only across the six-project matrix; submitted once in guarded account creation |
| Client validation          | Empty email, malformed email, password mismatch, and weak password remain on signup without an account request                         | Covered across the six-project matrix                                                       |
| Boundary validation        | Email exceeding standard length limits attempts the account API and shows a generic error                                              | Known bug; every automated request is intercepted and aborted                               |
| Account API                | Browser submission reaches `POST /api/accounts`; one investigation observed HTTP 201 and safe submitted fields in `{ account, token }` | Covered with a guarded Chromium English journey and privacy-safe observer                   |
| Account created            | Successful UI continues to `/getaquote`                                                                                                | Observed during bounded investigation and the final guarded confirmation                    |
| Quote selection            | `/getaquote` displays New mortgage, Mortgage renewal, and Refinance choices                                                            | Landing page observed only; no option is selected                                           |
| Mortgage application       | Property, borrower, financial, document, advisor, and application-submission steps                                                     | Not covered                                                                                 |
| Email lifecycle            | Delivery, content, link, expiration, and resend                                                                                        | Not covered; mailbox integration is deferred                                                |
| Existing-account lifecycle | Duplicate signup, login, logout, password reset, and cleanup                                                                           | Duplicate remains deferred; the other journeys are outside this signup slice                |

## Practical boundary

The positive test fills every visible signup field and consent control, submits the form, inspects the browser-triggered account response, and verifies the first post-signup route. It stops before choosing a mortgage purpose. The suite therefore proves the signup boundary and account handoff, while the downstream quote and mortgage application require separate feature briefs, data lifecycles, and human stage approvals.

# Moving the scheduled tasks to Supabase (step 6)

At the switch, each of the nine tasks gets PREAMBLE.txt (with the project URL
filled in) at the top of its prompt and `tools/evoldb.py` at the bottom under
the line THE DATABASE SCRIPT. The rest of each prompt stays as it is. The
service key is saved once as a network secret for the project host (header
`apikey`), so it never appears in a prompt.

Not done until the switch, because the claude.ai board is still the live one.

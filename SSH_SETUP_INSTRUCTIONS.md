# SSH Key Setup Instructions for GitHub

Follow these steps to set up SSH authentication for GitHub:

## Step 1: Check for Existing SSH Keys

First, check if you already have SSH keys:

```bash
ls -la ~/.ssh
```

Look for files named `id_rsa` and `id_rsa.pub`, or `id_ed25519` and `id_ed25519.pub`. If you see these files, you already have SSH keys and can skip to Step 3.

## Step 2: Generate a New SSH Key

If you don't have SSH keys, generate a new one. Replace `your_email@example.com` with your GitHub email:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

**When prompted:**
- Press Enter to accept the default file location (`~/.ssh/id_ed25519`)
- Enter a passphrase (optional but recommended for security), or press Enter twice to skip

## Step 3: Start the SSH Agent

Start the SSH agent in the background:

```bash
eval "$(ssh-agent -s)"
```

## Step 4: Add Your SSH Key to the SSH Agent

Add your SSH private key to the SSH agent:

```bash
ssh-add ~/.ssh/id_ed25519
```

(If you used a different key name or type, replace `id_ed25519` with your key name)

## Step 5: Copy Your Public Key

Display your public key so you can copy it:

```bash
cat ~/.ssh/id_ed25519.pub
```

**Copy the entire output** - it should look something like:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... your_email@example.com
```

## Step 6: Add SSH Key to GitHub

1. Go to GitHub.com and sign in
2. Click your profile picture in the top right → **Settings**
3. In the left sidebar, click **SSH and GPG keys**
4. Click **New SSH key** or **Add SSH key**
5. In the "Title" field, add a descriptive label (e.g., "MacBook Pro")
6. In the "Key" field, paste your public key (the one you copied in Step 5)
7. Click **Add SSH key**
8. If prompted, confirm your GitHub password

## Step 7: Test Your SSH Connection

Test that everything is working:

```bash
ssh -T git@github.com
```

You should see a message like:
```
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

If you see this, you're all set!

## Step 8: Pull from Repository

Now you can pull from your repository:

```bash
cd /Users/ritviktirumala/fbla-project
git pull
```

---

## Troubleshooting

**If you get "Permission denied" after following these steps:**
- Make sure you added the correct public key to GitHub (the `.pub` file, not the private key)
- Verify the SSH agent is running: `eval "$(ssh-agent -s)"`
- Make sure the key is added: `ssh-add ~/.ssh/id_ed25519`
- Try the test connection again: `ssh -T git@github.com`

**If you have multiple SSH keys:**
- You can create a `~/.ssh/config` file to specify which key to use for GitHub
- Or use `ssh-add` to add the specific key you want to use


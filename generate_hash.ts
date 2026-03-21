import bcrypt from 'bcryptjs';

async function generateHash() {
    const password = 'Admin@123';
    const hash = await bcrypt.hash(password, 12);
    console.log(hash);
}

generateHash();

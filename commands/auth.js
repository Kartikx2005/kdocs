import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();


export async function registerUser(username, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  console.log('User registered:', username);
}

export async function loginUser(username, password) {
  const user = users.find(u => u.username === username);
  if (!user) return console.log('User not found');
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return console.log('Invalid password');
  
  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('Login successful. Token:', token);
  return token;
}

export function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access Denied');
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid Token');
    req.user = user;
    next();
  });
}

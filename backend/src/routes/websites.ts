import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const websites = await prisma.website.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(websites);
  } catch (error) {
    console.error('Websites fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch websites' });
  }
});

router.post('/', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const { name, domain } = req.body;

    if (!name || !domain) {
      return res.status(400).json({ error: 'Name and domain are required' });
    }

    const website = await prisma.website.create({
      data: { name, domain },
    });

    res.json(website);
  } catch (error) {
    console.error('Website creation error:', error);
    res.status(500).json({ error: 'Failed to create website' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    const website = await prisma.website.findUnique({
      where: { id: req.params.id },
    });

    if (!website) {
      return res.status(404).json({ error: 'Website not found' });
    }

    res.json(website);
  } catch (error) {
    console.error('Website fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch website' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const prisma = (req as any).prisma;
    await prisma.website.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Website deletion error:', error);
    res.status(500).json({ error: 'Failed to delete website' });
  }
});

export default router;

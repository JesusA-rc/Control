import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from './prisma.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(currentDir, '../.env') })

const app = express()
const port = Number(process.env.PORT || 3001)
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: frontendOrigin }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

function serializeFinanza(finanza) {
  return {
    id: finanza.id,
    tipo: finanza.tipo,
    monto: Number(finanza.monto),
    descripcion: finanza.descripcion,
    categoria: finanza.categoria,
    producto: finanza.producto,
    ingredientes: finanza.ingredientes,
    creado_en: finanza.creadoEn,
  }
}

const defaultExpenseCategories = [
  'Bebidas',
  'Comida',
  'Suscripciones',
  'Entretenimiento',
  'Juegos',
  'Delivery',
]

function cleanCategory(category) {
  return category?.trim().slice(0, 80) || ''
}

app.get('/api/finanzas', async (_req, res, next) => {
  try {
    const rows = await prisma.finanza.findMany({
      orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
    })

    res.json(rows.map(serializeFinanza))
  } catch (error) {
    next(error)
  }
})

app.get('/api/finanzas/resumen', async (_req, res, next) => {
  try {
    const [incomeSummary, expenseSummary] = await Promise.all([
      prisma.finanza.aggregate({
        _sum: { monto: true },
        where: { tipo: 'ingreso' },
      }),
      prisma.finanza.aggregate({
        _sum: { monto: true },
        where: { tipo: 'gasto' },
      }),
    ])

    const ingresos = Number(incomeSummary._sum.monto || 0)
    const gastos = Number(expenseSummary._sum.monto || 0)

    res.json({
      ingresos,
      gastos,
      balance: ingresos - gastos,
    })
  } catch (error) {
    next(error)
  }
})

app.get('/api/gastos', async (_req, res, next) => {
  try {
    const rows = await prisma.finanza.findMany({
      where: { tipo: 'gasto' },
      orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
    })

    res.json(rows.map(serializeFinanza))
  } catch (error) {
    next(error)
  }
})

app.get('/api/productos', async (_req, res, next) => {
  try {
    const rows = await prisma.finanza.findMany({
      where: {
        tipo: 'gasto',
        producto: { not: null },
      },
      select: { producto: true },
      distinct: ['producto'],
      orderBy: { producto: 'asc' },
    })

    res.json(rows.map((row) => row.producto).filter(Boolean))
  } catch (error) {
    next(error)
  }
})

app.get('/api/categorias', async (_req, res, next) => {
  try {
    const rows = await prisma.finanza.findMany({
      where: {
        tipo: 'gasto',
        categoria: { not: null },
      },
      select: { categoria: true },
      distinct: ['categoria'],
      orderBy: { categoria: 'asc' },
    })

    const categories = new Set(defaultExpenseCategories)
    rows.forEach((row) => {
      const category = cleanCategory(row.categoria)

      if (category) {
        categories.add(category)
      }
    })

    res.json([...categories])
  } catch (error) {
    next(error)
  }
})

app.post('/api/finanzas', async (req, res, next) => {
  try {
    const {
      tipo,
      monto,
      descripcion = null,
      categoria = null,
      producto = null,
      ingredientes = null,
    } = req.body
    const amount = Number(monto)

    if (!['ingreso', 'gasto'].includes(tipo)) {
      return res.status(400).json({ message: 'El tipo debe ser ingreso o gasto.' })
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a 0.' })
    }

    const cleanedCategory = cleanCategory(categoria)

    if (tipo === 'gasto') {
      if (!cleanedCategory) {
        return res.status(400).json({ message: 'Indica la categoria del gasto.' })
      }

      if (!producto?.trim()) {
        return res.status(400).json({ message: 'Indica el producto comprado.' })
      }
    }

    const finanza = await prisma.finanza.create({
      data: {
        tipo,
        monto: amount,
        descripcion: descripcion || null,
        categoria: tipo === 'gasto' ? cleanedCategory : null,
        producto: tipo === 'gasto' ? producto.trim() : null,
        ingredientes: tipo === 'gasto' ? ingredientes?.trim() || null : null,
      },
    })

    res.status(201).json(serializeFinanza(finanza))
  } catch (error) {
    next(error)
  }
})

app.put('/api/gastos/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { monto, categoria, producto, ingredientes = null } = req.body
    const amount = Number(monto)

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'El gasto no es valido.' })
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'El monto debe ser mayor a 0.' })
    }

    const cleanedCategory = cleanCategory(categoria)

    if (!cleanedCategory) {
      return res.status(400).json({ message: 'Indica la categoria del gasto.' })
    }

    if (!producto?.trim()) {
      return res.status(400).json({ message: 'Indica el producto comprado.' })
    }

    const finanza = await prisma.finanza.update({
      where: { id, tipo: 'gasto' },
      data: {
        monto: amount,
        categoria: cleanedCategory,
        producto: producto.trim(),
        ingredientes: ingredientes?.trim() || null,
      },
    })

    res.json(serializeFinanza(finanza))
  } catch (error) {
    next(error)
  }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(error.statusCode || 500).json({
    message: error.statusCode ? error.message : 'No se pudo completar la operacion.',
  })
})

app.listen(port, () => {
  console.log(`Backend listo en http://localhost:${port}`)
})

import cors from 'cors'
import express from 'express'
import dotenv from 'dotenv'
import { prisma } from './prisma.js'

dotenv.config()

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

const expenseCategories = new Set([
  'Bebidas',
  'Comida',
  'Suscripciones',
  'Entretenimiento',
  'Juegos',
  'Delivery',
])

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

    if (tipo === 'gasto') {
      if (!expenseCategories.has(categoria)) {
        return res.status(400).json({ message: 'Selecciona una categoria valida.' })
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
        categoria: tipo === 'gasto' ? categoria : null,
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

    if (!expenseCategories.has(categoria)) {
      return res.status(400).json({ message: 'Selecciona una categoria valida.' })
    }

    if (!producto?.trim()) {
      return res.status(400).json({ message: 'Indica el producto comprado.' })
    }

    const finanza = await prisma.finanza.update({
      where: { id, tipo: 'gasto' },
      data: {
        monto: amount,
        categoria,
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
  res.status(500).json({ message: 'No se pudo completar la operacion.' })
})

app.listen(port, () => {
  console.log(`Backend listo en http://localhost:${port}`)
})

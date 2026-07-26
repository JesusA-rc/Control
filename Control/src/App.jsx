import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router'
import './App.css'

const navItems = [
  {
    label: 'Finanzas',
    path: '/finanzas',
    icon: '$',
  },
  {
    label: 'Grafica',
    path: '/grafica',
    icon: '%',
  },
  {
    label: 'Gastos',
    path: '/gastos',
    icon: '#',
  },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const defaultExpenseCategories = [
  'Bebidas',
  'Comida',
  'Suscripciones',
  'Entretenimiento',
  'Juegos',
  'Delivery',
]
const newCategoryValue = '__nueva_categoria__'
const newProductValue = '__nuevo__'
const chartPeriods = {
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
}

const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const buildChartBuckets = (period) => {
  const today = normalizeDate(new Date())

  if (period === 'year') {
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(today.getFullYear(), index, 1)

      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(date),
        amount: 0,
      }
    })
  }

  if (period === 'month') {
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

    return Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), index + 1)

      return {
        key: formatDateKey(date),
        label: String(index + 1),
        amount: 0,
      }
    })
  }

  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - dayOfWeek)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)

    return {
      key: formatDateKey(date),
      label: new Intl.DateTimeFormat('es-MX', { weekday: 'short' }).format(date),
      amount: 0,
    }
  })
}

const getExpenseBucketKey = (date, period) => {
  if (period === 'year') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  return formatDateKey(date)
}

const mergeCategories = (categories) =>
  Array.from(
    new Set([
      ...defaultExpenseCategories,
      ...categories.map((category) => category?.trim()).filter(Boolean),
    ]),
  )

const loadCategories = async () => {
  const response = await fetch(`${API_URL}/api/categorias`)

  if (!response.ok) {
    throw new Error('No se pudieron cargar las categorias.')
  }

  return response.json()
}

const getCurrentWeekRange = () => {
  const today = normalizeDate(new Date())
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - dayOfWeek)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  return { weekStart, weekEnd }
}

const getWeeklyExpenseTotal = (expenses) => {
  const { weekStart, weekEnd } = getCurrentWeekRange()

  return expenses.reduce((total, expense) => {
    const expenseDate = new Date(expense.creado_en)

    if (expenseDate >= weekStart && expenseDate < weekEnd) {
      return total + (Number(expense.monto) || 0)
    }

    return total
  }, 0)
}

function Finanzas() {
  const spendingLimit = 600
  const [incomeAmount, setIncomeAmount] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [categories, setCategories] = useState(defaultExpenseCategories)
  const [expenseCategory, setExpenseCategory] = useState(defaultExpenseCategories[0])
  const [newExpenseCategory, setNewExpenseCategory] = useState('')
  const [expenseProduct, setExpenseProduct] = useState('')
  const [newExpenseProduct, setNewExpenseProduct] = useState('')
  const [expenseIngredients, setExpenseIngredients] = useState('')
  const [products, setProducts] = useState([])
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [weeklyExpenses, setWeeklyExpenses] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const applySummary = (data) => {
    setIncome(Number(data.ingresos) || 0)
    setExpenses(Number(data.gastos) || 0)
  }

  const loadSummary = async () => {
    const response = await fetch(`${API_URL}/api/finanzas/resumen`)

    if (!response.ok) {
      throw new Error('No se pudo cargar el resumen.')
    }

    return response.json()
  }

  const loadProducts = async () => {
    const response = await fetch(`${API_URL}/api/productos`)

    if (!response.ok) {
      throw new Error('No se pudieron cargar los productos.')
    }

    return response.json()
  }

  const loadExpenses = async () => {
    const response = await fetch(`${API_URL}/api/gastos`)

    if (!response.ok) {
      throw new Error('No se pudieron cargar los gastos.')
    }

    return response.json()
  }

  useEffect(() => {
    let ignore = false

    async function hydrateData() {
      try {
        const [summaryData, productData, categoryData, expenseData] = await Promise.all([
          loadSummary(),
          loadProducts(),
          loadCategories(),
          loadExpenses(),
        ])

        if (!ignore) {
          applySummary(summaryData)
          setProducts(productData)
          setCategories(mergeCategories(categoryData))
          setWeeklyExpenses(getWeeklyExpenseTotal(expenseData))
        }
      } catch {
        if (!ignore) {
          setStatusMessage('Inicia el backend para cargar los datos guardados.')
        }
      }
    }

    hydrateData()

    return () => {
      ignore = true
    }
  }, [])

  const balance = income - expenses
  const limitProgress = Math.min((weeklyExpenses / spendingLimit) * 100, 100)
  const limitStatus = useMemo(() => {
    if (weeklyExpenses >= spendingLimit) {
      return 'danger'
    }

    if (weeklyExpenses >= spendingLimit / 2) {
      return 'warning'
    }

    return 'normal'
  }, [weeklyExpenses])

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const saveMovement = async (tipo, monto, details = {}) => {
    setIsSaving(true)
    setStatusMessage('')

    try {
      const response = await fetch(`${API_URL}/api/finanzas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipo, monto, ...details }),
      })

      if (!response.ok) {
        throw new Error('No se pudo guardar el movimiento.')
      }

      const data = await loadSummary()
      applySummary(data)
      setProducts(await loadProducts())
      setCategories(mergeCategories(await loadCategories()))
      setWeeklyExpenses(getWeeklyExpenseTotal(await loadExpenses()))
      setStatusMessage('Movimiento guardado.')
    } catch (error) {
      setStatusMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const addIncome = (event) => {
    event.preventDefault()
    const value = Number(incomeAmount)

    if (!value || value <= 0) {
      return
    }

    saveMovement('ingreso', value)
    setIncomeAmount('')
  }

  const addExpense = (event) => {
    event.preventDefault()
    const value = Number(expenseAmount)
    const category =
      expenseCategory === newCategoryValue ? newExpenseCategory.trim() : expenseCategory.trim()
    const product =
      expenseProduct === newProductValue ? newExpenseProduct.trim() : expenseProduct.trim()

    if (!value || value <= 0) {
      return
    }

    if (!product) {
      setStatusMessage('Indica el producto comprado.')
      return
    }

    if (!category) {
      setStatusMessage('Indica la categoria del gasto.')
      return
    }

    saveMovement('gasto', value, {
      categoria: category,
      producto: product,
      ingredientes: expenseIngredients,
    })
    setExpenseAmount('')
    setExpenseCategory(category)
    setNewExpenseCategory('')
    setExpenseProduct('')
    setNewExpenseProduct('')
    setExpenseIngredients('')
  }

  return (
    <section className="page-panel">
      <p className="eyebrow">Panel</p>
      <h1>Finanzas</h1>
      <div className="finance-grid">
        <article>
          <span>Balance</span>
          <strong>{formatter.format(balance)}</strong>
        </article>
        <article>
          <span>Ingresos</span>
          <strong>{formatter.format(income)}</strong>
        </article>
        <article>
          <span>Gastos</span>
          <strong>{formatter.format(expenses)}</strong>
        </article>
      </div>

      <div className="finance-actions">
        <article className={`limit-card ${limitStatus}`}>
          <div className="limit-header">
            <div>
              <span>Limite de gastos</span>
              <strong>{formatter.format(weeklyExpenses)}</strong>
            </div>
            <p>{formatter.format(spendingLimit)}</p>
          </div>
          <div className="limit-track" aria-hidden="true">
            <div style={{ width: `${limitProgress}%` }}></div>
          </div>
          <p className="limit-copy">
            {limitStatus === 'danger'
              ? 'Limite alcanzado'
              : `${formatter.format(spendingLimit - weeklyExpenses)} disponibles esta semana`}
          </p>
        </article>

        <div className="money-forms">
          <form onSubmit={addIncome}>
            <label htmlFor="income-amount">Guardar ingreso</label>
            <div className="money-control">
              <input
                id="income-amount"
                min="0"
                step="0.01"
                type="number"
                value={incomeAmount}
                onChange={(event) => setIncomeAmount(event.target.value)}
                placeholder="0"
              />
              <button type="submit" disabled={isSaving}>
                Guardar
              </button>
            </div>
          </form>

          <form onSubmit={addExpense}>
            <label htmlFor="expense-amount">Realizar gasto</label>
            <div className="expense-form-grid">
              <select
                aria-label="Categoria"
                value={expenseCategory}
                onChange={(event) => setExpenseCategory(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
                <option value={newCategoryValue}>Nueva categoria</option>
              </select>
              {expenseCategory === newCategoryValue && (
                <input
                  aria-label="Nueva categoria"
                  value={newExpenseCategory}
                  onChange={(event) => setNewExpenseCategory(event.target.value)}
                  placeholder="Categoria"
                />
              )}
              <select
                aria-label="Producto comprado"
                value={expenseProduct}
                onChange={(event) => setExpenseProduct(event.target.value)}
              >
                <option value="">Producto</option>
                {products.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
                <option value={newProductValue}>Nuevo producto</option>
              </select>
              {expenseProduct === newProductValue && (
                <input
                  aria-label="Nuevo producto"
                  value={newExpenseProduct}
                  onChange={(event) => setNewExpenseProduct(event.target.value)}
                  placeholder="Producto comprado"
                />
              )}
              <input
                id="expense-amount"
                min="0"
                step="0.01"
                type="number"
                value={expenseAmount}
                onChange={(event) => setExpenseAmount(event.target.value)}
                placeholder="0"
              />
              <textarea
                aria-label="Ingredientes"
                value={expenseIngredients}
                onChange={(event) => setExpenseIngredients(event.target.value)}
                placeholder={'Ingredientes\n- Agua\n- Azucar'}
                rows="5"
              />
              <button type="submit" disabled={isSaving}>
                Gastar
              </button>
            </div>
          </form>
          {statusMessage && <p className="form-status">{statusMessage}</p>}
        </div>
      </div>
    </section>
  )
}

function Gastos() {
  const [expenses, setExpenses] = useState([])
  const [editingExpense, setEditingExpense] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [categories, setCategories] = useState(defaultExpenseCategories)
  const [editCategory, setEditCategory] = useState(defaultExpenseCategories[0])
  const [editProduct, setEditProduct] = useState('')
  const [editIngredients, setEditIngredients] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const dateFormatter = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const loadExpenses = async () => {
    const response = await fetch(`${API_URL}/api/gastos`)

    if (!response.ok) {
      throw new Error('No se pudieron cargar los gastos.')
    }

    return response.json()
  }

  useEffect(() => {
    let ignore = false

    Promise.all([loadExpenses(), loadCategories()])
      .then(([expenseData, categoryData]) => {
        if (!ignore) {
          setExpenses(expenseData)
          setCategories(mergeCategories(categoryData))
        }
      })
      .catch((error) => {
        if (!ignore) {
          setStatusMessage(error.message)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const startEditing = (expense) => {
    setEditingExpense(expense)
    setEditAmount(String(expense.monto))
    setEditCategory(expense.categoria || defaultExpenseCategories[0])
    setEditProduct(expense.producto || '')
    setEditIngredients(expense.ingredientes || '')
    setStatusMessage('')
  }

  const closeEditor = () => {
    setEditingExpense(null)
    setEditAmount('')
    setEditProduct('')
    setEditIngredients('')
  }

  const saveExpense = async (event) => {
    event.preventDefault()
    const amount = Number(editAmount)

    if (!editingExpense || !amount || amount <= 0) {
      return
    }

    if (!editProduct.trim()) {
      setStatusMessage('Indica el producto comprado.')
      return
    }

    setIsSaving(true)
    setStatusMessage('')

    try {
      const response = await fetch(`${API_URL}/api/gastos/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monto: amount,
          categoria: editCategory,
          producto: editProduct,
          ingredientes: editIngredients,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo actualizar el gasto.')
      }

      setExpenses(await loadExpenses())
      setCategories(mergeCategories(await loadCategories()))
      setStatusMessage('Gasto actualizado.')
      closeEditor()
    } catch (error) {
      setStatusMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page-panel expenses-panel">
      <p className="eyebrow">Detalle</p>
      <h1>Gastos</h1>
      {statusMessage && <p className="form-status">{statusMessage}</p>}
      {editingExpense && (
        <form className="edit-expense-form" onSubmit={saveExpense}>
          <div className="edit-form-header">
            <h2>Editar gasto</h2>
            <button type="button" onClick={closeEditor}>
              Cancelar
            </button>
          </div>
          <div className="expense-form-grid">
            <select
              aria-label="Categoria"
              value={editCategory}
              onChange={(event) => setEditCategory(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              aria-label="Producto comprado"
              value={editProduct}
              onChange={(event) => setEditProduct(event.target.value)}
              placeholder="Producto comprado"
            />
            <input
              aria-label="Cantidad"
              min="0"
              step="0.01"
              type="number"
              value={editAmount}
              onChange={(event) => setEditAmount(event.target.value)}
              placeholder="0"
            />
            <textarea
              aria-label="Ingredientes"
              value={editIngredients}
              onChange={(event) => setEditIngredients(event.target.value)}
              placeholder={'Ingredientes\n- Agua\n- Azucar'}
              rows="6"
            />
            <button type="submit" disabled={isSaving}>
              Guardar cambios
            </button>
          </div>
        </form>
      )}
      <div className="expenses-table-wrap">
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Producto</th>
              <th>Fecha</th>
              <th>Cantidad</th>
              <th>Ingredientes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.categoria || '-'}</td>
                <td>{expense.producto || '-'}</td>
                <td>{dateFormatter.format(new Date(expense.creado_en))}</td>
                <td>{formatter.format(expense.monto)}</td>
                <td>
                  <span className="ingredients-cell">{expense.ingredientes || '-'}</span>
                </td>
                <td>
                  <button className="table-action-button" type="button" onClick={() => startEditing(expense)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {!expenses.length && (
              <tr>
                <td colSpan="6">Sin gastos registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function GraficaGastos() {
  const [period, setPeriod] = useState('week')
  const [expenses, setExpenses] = useState([])
  const [statusMessage, setStatusMessage] = useState('')

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  useEffect(() => {
    let ignore = false

    async function loadExpenses() {
      try {
        const response = await fetch(`${API_URL}/api/gastos`)

        if (!response.ok) {
          throw new Error('No se pudieron cargar los gastos.')
        }

        const data = await response.json()

        if (!ignore) {
          setExpenses(data)
        }
      } catch (error) {
        if (!ignore) {
          setStatusMessage(error.message)
        }
      }
    }

    loadExpenses()

    return () => {
      ignore = true
    }
  }, [])

  const chartData = useMemo(() => {
    const buckets = buildChartBuckets(period)
    const bucketByKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))

    expenses.forEach((expense) => {
      const date = new Date(expense.creado_en)
      const key = getExpenseBucketKey(date, period)
      const bucket = bucketByKey.get(key)

      if (bucket) {
        bucket.amount += Number(expense.monto) || 0
      }
    })

    return buckets
  }, [expenses, period])

  const totalSpent = chartData.reduce((total, bucket) => total + bucket.amount, 0)
  const maxSpent = Math.max(...chartData.map((bucket) => bucket.amount), 0)
  const averageSpent = chartData.length ? totalSpent / chartData.length : 0

  return (
    <section className="page-panel chart-panel">
      <div className="chart-heading">
        <div>
          <p className="eyebrow">Analisis</p>
          <h1>Grafica de gastos</h1>
        </div>
        <div className="period-control" aria-label="Periodo de la grafica">
          {Object.entries(chartPeriods).map(([value, label]) => (
            <button
              key={value}
              className={period === value ? 'active' : ''}
              type="button"
              onClick={() => setPeriod(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {statusMessage && <p className="form-status">{statusMessage}</p>}

      <div className="chart-summary">
        <article>
          <span>Total gastado</span>
          <strong>{formatter.format(totalSpent)}</strong>
        </article>
        <article>
          <span>Promedio</span>
          <strong>{formatter.format(averageSpent)}</strong>
        </article>
        <article>
          <span>Periodo</span>
          <strong>{chartPeriods[period]}</strong>
        </article>
      </div>

      <div className="spending-chart" aria-label={`Gastos por ${chartPeriods[period].toLowerCase()}`}>
        {chartData.map((bucket) => {
          const barHeight = maxSpent ? Math.max((bucket.amount / maxSpent) * 100, 3) : 0

          return (
            <div className="chart-column" key={bucket.key}>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ height: `${barHeight}%` }}
                  title={`${bucket.label}: ${formatter.format(bucket.amount)}`}
                ></div>
              </div>
              <strong>{formatter.format(bucket.amount)}</strong>
              <span>{bucket.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="brand-mark">C</div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className="nav-link">
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <div className="content-topline">
          <span>Control</span>
          <span>2026</span>
        </div>
        <Routes>
          <Route path="/" element={<Navigate to="/finanzas" replace />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/grafica" element={<GraficaGastos />} />
          <Route path="/gastos" element={<Gastos />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

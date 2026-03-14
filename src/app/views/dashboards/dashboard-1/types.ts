export type DashboardMetric = {
    id: string
    title: string
    value: number
    helper?: string
    icon: string
    iconBg?: string
    gradient: string
}

export type ProductType = {
    id: number
    image: string
    name: string
    category: string
    stock: string
    price: string
    ratings: number
    reviews: number
    status: string
    statusVariant: 'success' | 'warning' | 'danger'
}

export type OrderType = {
    id: string
    userImage: string
    userName: string
    product: string
    date: string
    amount: string
    status: string
    statusVariant: 'success' | 'warning' | 'danger'
}

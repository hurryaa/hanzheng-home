import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

interface ChartData {
  name: string;
  revenue: number;
  members: number;
  recharges: number;
  totalMembers?: number;
}

interface ChartCardProps {
  title: string;
  data: ChartData[];
  activeDataType: 'revenue' | 'members';
  onDataTypeChange: (type: 'revenue' | 'members') => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  data,
  activeDataType,
  onDataTypeChange
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${
                activeDataType === 'revenue'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
              onClick={() => onDataTypeChange('revenue')}
            >
              营业额
            </button>
            <button
              className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${
                activeDataType === 'members'
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
              onClick={() => onDataTypeChange('members')}
            >
              会员数
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#8c8c8c"
                tick={{ fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                yAxisId="left"
                stroke="#8c8c8c"
                tick={{ fill: '#6b7280' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#8c8c8c"
                tick={{ fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  padding: '12px',
                  fontSize: '14px'
                }}
                labelStyle={{ fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}
                itemStyle={{ margin: '4px 0' }}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Legend wrapperStyle={{ paddingTop: '16px' }} />

              {activeDataType === 'revenue' ? (
                <>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name="营业额"
                    stroke="#165DFF"
                    strokeWidth={3}
                    dot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#165DFF' }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#165DFF' }}
                    animationBegin={300}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="recharges"
                    name="充值额"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#10B981' }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#10B981' }}
                    animationBegin={600}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </>
              ) : (
                <>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="members"
                    name="新增会员"
                    stroke="#165DFF"
                    strokeWidth={3}
                    dot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#165DFF' }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#165DFF' }}
                    animationDuration={1500}
                  />
                  {data[0]?.totalMembers !== undefined && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalMembers"
                      name="总会员数"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#10B981' }}
                      activeDot={{ r: 8, strokeWidth: 0, fill: '#10B981' }}
                      animationDuration={1500}
                      animationBegin={300}
                    />
                  )}
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};